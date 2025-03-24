import { Injectable,Inject, InternalServerErrorException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { InsertUser, SelectTenant, SelectUser } from '@repo/api-contract';
import { eq , and} from 'drizzle-orm';

@Injectable()
export class UsersService {
    constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>){}

    async createUser(userData: InsertUser,tenantId: string,customer:boolean,owner:boolean,roles:number[]): Promise<string> {
        let tenantUser_id: number
        await this.db.transaction(async (tx) => {
             await tx.insert(schema.User).values(userData)

             const user = await  tx.query.User.findFirst({ where: (user,{eq}) => eq(user.email,userData.email)})
            
             if (!user) throw new InternalServerErrorException("Error occured while creating user")

             tenantUser_id = await tx.insert(schema.TenantHasUsers).values({ tenantId, userId: user.id}).$returningId()[0].id

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

    async update(id: string, userData: Partial<InsertUser>): Promise<void>{
        await this.db.update(schema.User).set(userData).where(eq(schema.User.id, id));
        
    }
    async remove(id: string): Promise<void> {
        await this.db.delete(schema.User).where(eq(schema.User.id, id));
    }

}
