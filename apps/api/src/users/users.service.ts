import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { InsertUser, SelectUser, UpdateUser } from '@repo/api-contract';
import { eq, and, sql } from 'drizzle-orm';
import { hash } from 'argon2';

const userTypes = ["customer", "owner", "system"] as const;
type UserType = (typeof userTypes)[number];

@Injectable()
export class UsersService {
    constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) { }

    validateRoles(input: string[]): UserType[] {
        for (const role of input) {
            if (!userTypes.includes(role as UserType)) {
                throw new Error(`Invalid role: ${role}`);
            }
        }
        return input as UserType[];
    }

    async createUser(userData: InsertUser, tenantId: string, roles: number[]): Promise<string> {
        let tenantUser_id: number;
        let userId: string;
        
        await this.db.transaction(async (tx) => {
            // Check if user already exists
            const existingUser = await tx.query.User.findFirst({ 
                where: (user, { eq }) => eq(user.email, userData.email) 
            });
            
            if (existingUser) {
                // User already exists, check if they're already in this tenant
                const existingTenantUser = await tx.query.TenantHasUsers.findFirst({
                    where: (tu, { and, eq }) => and(
                        eq(tu.userId, existingUser.id),
                        eq(tu.tenantId, tenantId)
                    )
                });
                
                if (existingTenantUser) {
                    // User already exists in this tenant
                    tenantUser_id = existingTenantUser.id;
                    userId = existingUser.id;
                } else {
                    // User exists but not in this tenant, add them to this tenant
                    const [{ id }] = await tx.insert(schema.TenantHasUsers).values({ 
                        tenantId, 
                        userId: existingUser.id 
                    }).$returningId();
                    
                    tenantUser_id = id;
                    userId = existingUser.id;
                }
            } else {
                // Create new user
                if (!userData.userType.includes("system")) {
                    userData.password = Math.random().toString(36).slice(-8);
                }
                const hashedPassword = await hash(userData.password);
                await tx.insert(schema.User).values({
                    name: userData.name,
                    email: userData.email,
                    password: hashedPassword,
                    userType: userData.userType 
                });
                
                const user = await tx.query.User.findFirst({ 
                    where: (user, { eq }) => eq(user.email, userData.email) 
                });
                
                if (!user) throw new InternalServerErrorException("Error occurred while creating user");
                
                const [{ id }] = await tx.insert(schema.TenantHasUsers).values({ 
                    tenantId, 
                    userId: user.id 
                }).$returningId();
                
                tenantUser_id = id;
                userId = user.id;
            }
            
            // Handle customer role if needed
            if (userData.userType.includes("customer")) {
                const existingCustomer = await tx.query.Customer.findFirst({
                    where: (c, { eq ,and}) => and(eq(c.userId, userId),eq(c.tenantId, tenantId))
                });
                
                if (!existingCustomer) {
                    await tx.insert(schema.Customer).values({ userId, tenantId });
                }
            }
            
            // Handle owner role if needed
            if (userData.userType.includes("owner")) {
                const existingOwner = await tx.query.Owner.findFirst({
                    where: (o, { eq,and }) => and(eq(o.userId, userId),eq(o.tenantId, tenantId))
                });
                
                if (!existingOwner) {
                    await tx.insert(schema.Owner).values({ userId, tenantId });
                }
            }
            
            // Handle roles
            for (const role of roles) {
                const existingRole = await tx.query.UserHasRoles.findFirst({
                    where: (ur, { and, eq }) => and(
                        eq(ur.userId, userId),
                        eq(ur.roleId, (role)),
                        eq(ur.tenantId, tenantId)
                    )
                });
                
                if (!existingRole) {
                    await tx.insert(schema.UserHasRoles).values({ 
                        userId, 
                        roleId: (role) ,
                        tenantId
                    });
                }
            }
        });
        
        const tenantUser = await this.db.query.TenantHasUsers.findFirst({ 
            where: (tenant_user, { eq }) => eq(tenant_user.id, tenantUser_id) 
        });
        
        if (!tenantUser) throw new InternalServerErrorException("Error occurred while adding a tenant user");
        
        return tenantUser.userId;
    }

    async findAll(tenantId: string, page: number = 1, pageSize: number = 10): Promise<{ data: SelectUser[]; pagination: any }> {
  const offset = (page - 1) * pageSize;

  // Get total count (only system users)
  const totalCountResult = await this.db
    .select({ count: sql<number>`COUNT(DISTINCT ${schema.User.id})` })
    .from(schema.TenantHasUsers)
    .innerJoin(schema.User, eq(schema.TenantHasUsers.userId, schema.User.id))
    .where(and(
      eq(schema.TenantHasUsers.tenantId, tenantId),
      eq(schema.User.userType, 'system')
    ))
    .execute();
  const totalCount = totalCountResult[0]?.count || 0;

  const usersWithRoles = await this.db
    .select({
      user: schema.User,
      roles: schema.UserHasRoles
    })
    .from(schema.TenantHasUsers)
    .innerJoin(schema.User, eq(schema.TenantHasUsers.userId, schema.User.id))
    .leftJoin(schema.UserHasRoles, eq(schema.UserHasRoles.userId, schema.User.id))
    .where(and(
      eq(schema.TenantHasUsers.tenantId, tenantId),
      eq(schema.User.userType, 'system')
    ))
    .limit(pageSize)
    .offset(offset);

  // Group roles by user
  const userMap = new Map<string, SelectUser & { roles: number[] }>();

  usersWithRoles.forEach(row => {
    if (!userMap.has(row.user.id)) {
      userMap.set(row.user.id, {
        ...row.user,
        roles: row.roles?.roleId ? [row.roles.roleId] : []
      });
    } else if (row.roles?.roleId) {
      const user = userMap.get(row.user.id)!;
      if (!user.roles.includes(row.roles.roleId)) {
        user.roles.push(row.roles.roleId);
      }
    }
  });

  const paginationData = {
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    hasNextPage: page * pageSize < totalCount,
    hasPreviousPage: page > 1,
  };

  return {
    data: Array.from(userMap.values()),
    pagination: paginationData,
  };
}

    async findOne(id: string, tenantId?: string): Promise<SelectUser | Omit<SelectUser,"roles"> |undefined> {
        if (!tenantId)
            return this.db.query.User.findFirst({ where: (user, { eq }) => eq(user.id, id) });

        // Get user with roles using explicit join approach
        const userWithRoles = await this.db.select({
            user: schema.User,
            roles: schema.UserHasRoles
        })
        .from(schema.TenantHasUsers)
        .where(and(
            eq(schema.TenantHasUsers.tenantId, tenantId), 
            eq(schema.TenantHasUsers.userId, id)
        ))
        .innerJoin(schema.User, eq(schema.TenantHasUsers.userId, schema.User.id))
        .leftJoin(schema.UserHasRoles, eq(schema.UserHasRoles.userId, schema.User.id));

        if (userWithRoles.length === 0) return undefined;

        // Process the results to include roles
        const roleIds: number[] = [];
        userWithRoles.forEach(row => {
            if (row.roles?.roleId && !roleIds.includes(row.roles.roleId)) {
                roleIds.push(row.roles.roleId);
            }
        });

        // Return user with roles
        return {
            ...userWithRoles[0].user,
            roles: roleIds
        };
    }

    async findByEmail(email: string): Promise<Omit<SelectUser, "roles"> | undefined> {
        return this.db.query.User.findFirst({ where: (user, { eq }) => eq(user.email, email) });
    }

    async update(id: string,tenantId: string ,userData: UpdateUser, roles: number[], ownerData?: schema.UpdateOwner,customerData?: schema.UpdateCustomer): Promise<void> {
        await this.db.transaction(async (tx) => {
            // Update user dat
            let hashedPassword: string | undefined;
            if (userData.password) {
                hashedPassword = await hash(userData.password);
                userData.password = hashedPassword;
            }
            // If userData empty skip update
            if (Object.keys(userData).length > 0) 
            await tx.update(schema.User).set({ ...userData, password: hashedPassword }).where(eq(schema.User.id, id));

            // Handle customer role
            if (userData.userType?.includes("customer")) {
                const existingCustomer = await tx.query.Customer.findFirst({
                    where: (customer, { eq, and }) => and(eq(customer.userId, id), eq(customer.tenantId, tenantId))
                });

                if (!existingCustomer) {
                    await tx.insert(schema.Customer).values({ userId: id, tenantId: tenantId,...customerData });
                }
            } else {
                // Optionally: Remove customer if flag is false
                await tx.delete(schema.Customer).where(eq(schema.Customer.userId, id));
            }

            // Handle owner role
            if (userData.userType?.includes("owner")) {
                const existingOwner = await tx.query.Owner.findFirst({
                    where: (owner, { eq, and }) => and(eq(owner.userId, id), eq(owner.tenantId, tenantId))
                });

                if (!existingOwner) {
                    await tx.insert(schema.Owner).values({ userId: id, tenantId: tenantId, ...ownerData  });
                }
            } else {
                // Optionally: Remove owner if flag is false
                await tx.delete(schema.Owner).where(eq(schema.Owner.userId, id));
            }

            // Handle roles - first get existing roles
            const existingRoles = await tx.query.UserHasRoles.findMany({
                where: (userRole, { eq }) => eq(userRole.userId, id)
            });

            const existingRoleIds = existingRoles.map(role => (role.roleId));

            // Add new roles that don't exist yet
            for (const roleId of roles) {
                if (!existingRoleIds.includes(roleId)) {
                    await tx.insert(schema.UserHasRoles).values({
                        userId: id,
                        roleId: (roleId),
                        tenantId
                    });
                }
            }

            // Optionally: Remove roles that are no longer assigned
            const rolesToRemove = existingRoleIds.filter(existingId => !roles.includes(existingId));
            for (const roleId of rolesToRemove) {
                await tx.delete(schema.UserHasRoles)
                    .where(and(
                        eq(schema.UserHasRoles.userId, id),
                        eq(schema.UserHasRoles.roleId, (roleId))
                    ));
            }
        });
    }

    async getCustomers(tenantId: string, page: number = 1, pageSize: number = 10): Promise<{ data: { customer: schema.SelectCustomer, user: Omit<SelectUser, "roles"> }[]; pagination: any }> {
        const offset = (page - 1) * pageSize;

        // Get total count
        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.TenantHasUsers)
            .innerJoin(schema.User, eq(schema.TenantHasUsers.userId, schema.User.id))
            .innerJoin(schema.Customer, eq(schema.Customer.userId, schema.User.id))
            .execute();
        const totalCount = totalCountResult[0]?.count || 0;

        const rows = await this.db.select().from(schema.TenantHasUsers).where(eq(schema.TenantHasUsers.tenantId, tenantId)).innerJoin(schema.User, eq(schema.TenantHasUsers.userId, schema.User.id)).innerJoin(schema.Customer, eq(schema.Customer.userId, schema.User.id)).limit(pageSize).offset(offset)

        const paginationData = {
            page,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            hasNextPage: page * pageSize < totalCount,
            hasPreviousPage: page > 1,
        };

        return {
            data: rows.map(row => ({ customer: row.customer_details, user: row.users })),
            pagination: paginationData,
        };
    }

    async getOwners(tenantId: string, page: number = 1, pageSize: number = 10): Promise<{ data: { owner: schema.SelectOwner, user: Omit<SelectUser, "roles"> }[]; pagination: any }> {
        const offset = (page - 1) * pageSize;

        // Get total count
        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.TenantHasUsers)
            .where(eq(schema.TenantHasUsers.tenantId, tenantId))
            .innerJoin(schema.User, eq(schema.TenantHasUsers.userId, schema.User.id))
            .innerJoin(schema.Owner, eq(schema.Owner.userId, schema.User.id))
            .execute();
        const totalCount = totalCountResult[0]?.count || 0;

        const rows = await this.db.select().from(schema.TenantHasUsers).where(eq(schema.TenantHasUsers.tenantId, tenantId)).innerJoin(schema.User, eq(schema.TenantHasUsers.userId, schema.User.id)).innerJoin(schema.Owner, eq(schema.Owner.userId, schema.User.id)).limit(pageSize).offset(offset)

        const paginationData = {
            page,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            hasNextPage: page * pageSize < totalCount,
            hasPreviousPage: page > 1,
        };

        return {
            data: rows.map(row => ({ owner: row.owner_details, user: row.users })),
            pagination: paginationData,
        };
    }


    async remove(id: string, tenantId: string): Promise<void> {
        // First check if there's at least one admin in the tenant
        const admins = await this.db.select()
            .from(schema.TenantHasUsers)
            .where(and(eq(schema.TenantHasUsers.tenantId, tenantId), eq(schema.TenantHasUsers.isAdmin, true)))
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

    async isAdminUser(userId: string): Promise<boolean> {
        const user = await this.db.query.User.findFirst({
            where: (user, { eq, and }) => and(eq(user.id, userId), eq(user.userType, 'admin')),
        })
        return user !== null;
    }


}
