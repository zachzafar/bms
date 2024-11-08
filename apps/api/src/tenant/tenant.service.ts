// tenants.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '@repo/drizzle/src/schema';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { MySql2Database } from '@repo/drizzle';
import { InsertTenant, SelectTenant } from '@repo/drizzle/src/schema/tenant';
import { InsertUser, SelectUser} from '@repo/api-contract/src/users';

@Injectable()
export class TenantsService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>
  ) {}

  async createTenantWithAdmin(tenantData: InsertTenant, userData: InsertUser): Promise<{ tenant: SelectTenant; adminUser: Omit<SelectUser, "password">; }> {
    const tenantId = uuidv4();
        const userId = uuidv4();

    await this.db.transaction(async (tx) => {
        
        await tx.insert(schema.Tenant).values({...tenantData, id: tenantId});


       
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await tx.insert(schema.User).values({
        ...userData,
        id: userId,
        password: hashedPassword,
        tenantId,
        role: 'admin',
      })
     
        return {
            tenant: { ...tenantData, id: tenantId },
            adminUser: { ...userData, id: userId, tenantId},
        };
    

    });

    let user_ = await this.db.query.User.findMany({ where: (user,{eq}) => eq(user.id, userId) });
    const tenant = await this.db.query.Tenant.findMany({ where: (tenant,{eq}) => eq(tenant.id, tenantId) });

     const  {password ,...user  } = user_[0];
    return {
      adminUser: user,
      tenant: tenant[0],
    }
  }
}