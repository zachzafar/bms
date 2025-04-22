import { Injectable,Inject, InternalServerErrorException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { InsertUser, SelectUser, UpdateUser } from '@repo/api-contract';
import { eq , and} from 'drizzle-orm';
import { hash } from 'argon2';

@Injectable()
export class UsersService {
    constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>){}

    async createUser(userData: InsertUser,tenantId: string,customer:boolean,owner:boolean,roles:number[]): Promise<string> {
        let tenantUser_id: number
        await this.db.transaction(async (tx) => {

            const hashedPassword = await hash(userData.password);
             await tx.insert(schema.User).values({...userData, password: hashedPassword})

             const user = await  tx.query.User.findFirst({ where: (user,{eq}) => eq(user.email,userData.email)})
            
             if (!user) throw new InternalServerErrorException("Error occured while creating user")

             const [{id}] = await tx.insert(schema.TenantHasUsers).values({ tenantId, userId: user.id}).$returningId()
             tenantUser_id = id
             if (customer) await tx.insert(schema.Customer).values({userId: user.id})
             if (owner) await tx.insert(schema.Owner).values({userId: user.id})

            roles.forEach(async (role) => {
                await tx.insert(schema.UserHasRoles).values({userId: user.id,roleId: BigInt(role)})
            })
        })

        const tenantUser = await this.db.query.TenantHasUsers.findFirst({where: (tenant_user,{eq}) => eq(tenant_user.id,tenantUser_id)})

        if (!tenantUser) throw new InternalServerErrorException("Error occured while adding a tenant user")

            return tenantUser.userId
        
    }

    async findAll(tenantId?: string): Promise<SelectUser[]> {
        if(!tenantId) return this.db.query.User.findMany();

        const rows = await this.db.select().from(schema.TenantHasUsers).where(eq(schema.TenantHasUsers.tenantId,tenantId)).innerJoin(schema.User,eq(schema.TenantHasUsers.userId,schema.User.id))

        return rows.map(row => row.users)
    }

    async findOne(id: string,tenantId?:string): Promise<SelectUser | undefined> {
        if (!tenantId)
        return this.db.query.User.findFirst({ where: (user, { eq }) => eq(user.id, id) });

        const rows = await this.db.select().from(schema.TenantHasUsers).where(and(eq(schema.TenantHasUsers.tenantId,tenantId),eq(schema.TenantHasUsers.userId,id))).innerJoin(schema.User,eq(schema.TenantHasUsers.userId,schema.User.id))

        return rows[0].users
    }

    async findByEmail(email: string): Promise<SelectUser | undefined> {
        return this.db.query.User.findFirst({ where: (user, { eq }) => eq(user.email, email) });
    }

    async update(id: string, userData: UpdateUser, customer: boolean, owner: boolean, roles: number[]): Promise<void> {
        await this.db.transaction(async (tx) => {
            // Update user dat
            let hashedPassword: string | undefined;
            if (userData.password) {
                hashedPassword = await hash(userData.password);
                userData.password = hashedPassword;
            }
           
            await tx.update(schema.User).set({...userData,password: hashedPassword}).where(eq(schema.User.id, id));

            // Handle customer role
            if (customer) {
                const existingCustomer = await tx.query.Customer.findFirst({
                    where: (customer, { eq }) => eq(customer.userId, id)
                });
                
                if (!existingCustomer) {
                    await tx.insert(schema.Customer).values({ userId: id });
                }
            } else {
                // Optionally: Remove customer if flag is false
                await tx.delete(schema.Customer).where(eq(schema.Customer.userId, id));
            }
            
            // Handle owner role
            if (owner) {
                const existingOwner = await tx.query.Owner.findFirst({
                    where: (owner, { eq }) => eq(owner.userId, id)
                });
                
                if (!existingOwner) {
                    await tx.insert(schema.Owner).values({ userId: id });
                }
            } else {
                // Optionally: Remove owner if flag is false
                await tx.delete(schema.Owner).where(eq(schema.Owner.userId, id));
            }

            // Handle roles - first get existing roles
            const existingRoles = await tx.query.UserHasRoles.findMany({
                where: (userRole, { eq }) => eq(userRole.userId, id)
            });
            
            const existingRoleIds = existingRoles.map(role => Number(role.roleId));
            
            // Add new roles that don't exist yet
            for (const roleId of roles) {
                if (!existingRoleIds.includes(roleId)) {
                    await tx.insert(schema.UserHasRoles).values({
                        userId: id,
                        roleId: BigInt(roleId)
                    });
                }
            }
            
            // Optionally: Remove roles that are no longer assigned
            const rolesToRemove = existingRoleIds.filter(existingId => !roles.includes(existingId));
            for (const roleId of rolesToRemove) {
                await tx.delete(schema.UserHasRoles)
                    .where(and(
                        eq(schema.UserHasRoles.userId, id),
                        eq(schema.UserHasRoles.roleId, BigInt(roleId))
                    ));
            }
        });
    }

    async getCustomers(tenantId: string): Promise<{customer:schema.SelectCustomer,user: SelectUser}[]> {
        const rows = await this.db.select().from(schema.TenantHasUsers).where(eq(schema.TenantHasUsers.tenantId,tenantId)).innerJoin(schema.User,eq(schema.TenantHasUsers.userId,schema.User.id)).innerJoin(schema.Customer,eq(schema.Customer.userId,schema.User.id))
        return rows.map(row => ({customer:row.customer_details,user:row.users}))
    }

    async getOwners(tenantId: string): Promise<{owner:schema.SelectOwner,user: SelectUser}[]> {
        const rows = await this.db.select().from(schema.TenantHasUsers).where(eq(schema.TenantHasUsers.tenantId,tenantId)).innerJoin(schema.User,eq(schema.TenantHasUsers.userId,schema.User.id)).innerJoin(schema.Owner,eq(schema.Owner.userId,schema.User.id))
        return rows.map(row => ({owner:row.owner_details,user:row.users}))
    }


    async remove(id: string, tenantId: string): Promise<void> {
        // First check if there's at least one admin in the tenant
        const admins = await this.db.select()
            .from(schema.TenantHasUsers)
            .where(and(eq(schema.TenantHasUsers.tenantId, tenantId),eq(schema.TenantHasUsers.isAdmin, true)))
            .innerJoin(schema.User, eq(schema.TenantHasUsers.userId, schema.User.id))
        
        // Check if the user being removed is an admin and if there's only one admin
        const isUserAdmin = admins.some(admin => admin.users.id === id);
        if (isUserAdmin && admins.length <= 1) {
            throw new InternalServerErrorException("Cannot remove the last admin from a tenant");
        }

        // Remove user from the tenant
        await this.db.delete(schema.TenantHasUsers)
            .where(and(
                eq(schema.TenantHasUsers.userId, id),
                eq(schema.TenantHasUsers.tenantId, tenantId)
            ));
        
        // Check if user belongs to any other tenants
        const otherTenants = await this.db.query.TenantHasUsers.findMany({
            where: (tenantUser, { eq }) => eq(tenantUser.userId, id)
        });
        
        // If user doesn't belong to any other tenants, remove the user profile completely
        if (otherTenants.length === 0) {
            await this.db.delete(schema.User).where(eq(schema.User.id, id));
            // With cascade delete in the database schema, all related records will be automatically deleted
        }
    }
}
