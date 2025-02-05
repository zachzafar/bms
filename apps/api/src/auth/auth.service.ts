import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InsertTenant, InsertUser, SelectTenant, SelectUser } from '@repo/api-contract';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { ConfigType } from '@nestjs/config';
import refreshConfig from './config/refresh.config';
import { UsersService } from 'src/users/users.service';
import { eq,and, desc } from 'drizzle-orm';


@Injectable()
export class AuthService {
    private readonly loggger = new Logger(AuthService.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UsersService,
        @Inject(refreshConfig.KEY)
        private refreshTokenConfig: ConfigType<typeof refreshConfig>,
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>
      ) {}
    
      async createTenantWithAdmin(tenantData: InsertTenant, userData: Omit<InsertUser,"tenantId" | "role">): Promise<{ tenant: SelectTenant; adminUser: Omit<SelectUser, "password">; }> {
        const tenantId = uuidv4();
            const userId = uuidv4();
    
        await this.db.transaction(async (tx) => {
            
            await tx.insert(schema.Tenant).values({...tenantData, id: tenantId});
    
    
           
        const hashedPassword = await hash(userData.password);
          await tx.insert(schema.User).values({
            ...userData,
            id: userId,
            password: hashedPassword,
            role: 'ADMIN',
          })

          await tx.insert(schema.TenantHasUsers).values({
            tenantId,
            userId
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

      async login(email: string, password: string): Promise<{ user: Omit<SelectUser, "password">; tenants:string[] ;accessToken: string; refreshToken: string }> {

         let  user_ = await this.db.query.User.findFirst({ where: (user,{eq}) => eq(user.email, email )})
        
         if (!user_) {
          throw new UnauthorizedException('Invalid email or password');
      }
      
      

        let tenants = await this.db.select().from(schema.TenantHasUsers).where(eq(schema.TenantHasUsers.userId,user_.id))


        const tenantIds = tenants.map((tenant) => tenant.tenantId);

        // let tenant = await this.db.query.Tenant.findMany({ where: (tenant,{eq}) => eq(tenant.id, tenants[0].tenantId) });

        const isValid = await verify(user_.password,password);
        
        if (!isValid) {
          throw new UnauthorizedException('Invalid email or password');
        }

    
        const { accessToken, refreshToken } = await this.generateTokens(user_.id);
        
        const hashedToken = await hash(refreshToken);
        await this.db.insert(schema.refreshTokens).values({
            userId: user_.id,
            refreshToken: hashedToken,
        });
   
        const { password: _, ...user } = user_;

    
        return {
          user,
          tenants: tenantIds, 
          accessToken,
          refreshToken,
        };
      }

      async logout(userId: string ) {
       const rows = await this.db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, userId));
      }

      async validateLocalUser(email: string, password: string) {
        const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException('User not found!');
    const isPasswordMatched = verify(user.password, password);
    if (!isPasswordMatched)
      throw new UnauthorizedException('Invalid Credentials!');

    return { id: user.id, name: user.name, role: user.role };
      }

      async validateJwtUser(userId: string) {
        const user = await this.userService.findOne(userId);
        if (!user) throw new UnauthorizedException('User not found!');
        return { id: user.id, name: user.name, role: user.role };
      }

      async validateRefreshToken(userId:string,refreshToken:string){
        console.log("looking for refresh token")
        
        const tokens = await this.db.select().from(schema.refreshTokens).where(eq(schema.refreshTokens.userId, userId)).orderBy(desc(schema.refreshTokens.createdAt)).limit(1).execute();
        console.log("found token: ", tokens[0])
        if (tokens.length === 0) {
          throw new UnauthorizedException('Invalid refresh token');
        }
        console.log("found token now verifying...")
        const refreshTokenMatched = await verify(tokens[0].refreshToken, refreshToken);
        
        if (!refreshTokenMatched) {
          await this.logout(userId);
          throw new UnauthorizedException('Invalid refresh token');

        }
        console.log("refresh token matched")
        const { exp } = this.jwtService.decode(refreshToken) as { exp: number };
        const isExpired = Date.now() >= exp * 1000;
      
        if (isExpired) {
          // Execute the desired function when the token is expired
         await  this.logout(userId);
          throw new UnauthorizedException('Refresh Token Expired!');
        }
        console.log("returning user")
        const currentUser = { id: userId };
        return currentUser;
      }

      async refreshToken(userId: string) {
        const { accessToken, refreshToken } = await this.generateTokens(userId);
    
        const hashedToken = await hash(refreshToken);

        await this.db.update(schema.refreshTokens).set({ refreshToken: hashedToken,}).where( eq(schema.refreshTokens.userId, userId));
    
        const user_ = await this.db.query.User.findMany({ where: (user,{eq}) => eq(user.id, user.id) });
    
        return {
          user: user_[0],
          accessToken,
          refreshToken,
        };
      }

      async generateTokens(userId: string) {
        const payload = { sub: userId };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload),
            this.jwtService.signAsync(payload, this.refreshTokenConfig)])

        return {accessToken, refreshToken};
      }
    


      
}
