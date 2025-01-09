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
import { eq } from 'drizzle-orm';


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
            tenantId,
            role: 'ADMIN',
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

      async login(email: string, password: string): Promise<{ user: Omit<SelectUser, "password">; tenant:SelectTenant ;accessToken: string; refreshToken: string }> {
        const userWithTenant = await this.db.query.User.findMany({
            where: (user, { eq }) => eq(user.email, email),
          with: {
                tenant: true, // Include the related tenant data
            },
        });
        if (userWithTenant.length === 0) {
            throw new UnauthorizedException('Invalid email or password');
        }

        
        
        const user = userWithTenant.map((item) => {
            const { tenant, ...user } = item; // Destructure to separate user and tenant
            return user;
        })[0]
        
        const tenant = userWithTenant.map((item) => item.tenant).filter(Boolean)[0]

        const isValid = await verify(user.password,password);
        
        if (!isValid) {
          throw new UnauthorizedException('Invalid email or password');
        }

    
        const { accessToken, refreshToken } = await this.generateTokens(user.id);
        
        const hashedToken = await hash(refreshToken);
        await this.db.insert(schema.refreshTokens).values({
            userId: user.id,
            refreshToken: hashedToken,
        });
   
    
        return {
          user ,
          tenant,
          accessToken,
          refreshToken,
        };
      }

      async logout(userId: string ) {
        this.db.update(schema.refreshTokens).set({ revoked: true }).where(eq(schema.refreshTokens.userId, userId));
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

        const token = await this.db.query.refreshTokens.findFirst({
            where: (token, { and, eq }) => and(eq(token.userId, userId), eq(token.refreshToken, refreshToken), eq(token.revoked, false)),
        });

        if (!token) {
          throw new UnauthorizedException('Invalid refresh token');
        }

        const refreshTokenMatched = await verify(token.refreshToken, refreshToken);

        if (!refreshTokenMatched) {
          await this.logout(userId);
          throw new UnauthorizedException('Invalid refresh token');

        }
    
        const { exp } = this.jwtService.decode(refreshToken) as { exp: number };
        const isExpired = Date.now() >= exp * 1000;
      
        if (isExpired) {
          // Execute the desired function when the token is expired
         await  this.logout(userId);
          throw new UnauthorizedException('Refresh Token Expired!');
        }
      
        const currentUser = { id: userId };
        return currentUser;
      }

      async refreshToken(user: Omit<SelectUser,"password" | "createdAt" | "updatedAt" | "email" >) {
        const { accessToken, refreshToken } = await this.generateTokens(user.id);
    
        const hashedToken = await hash(refreshToken);
        await this.db.update(schema.refreshTokens).set({ revoked: true }).where( eq(schema.refreshTokens.userId, user.id));
        await this.db.insert(schema.refreshTokens).values({
            userId: user.id,
            refreshToken: hashedToken,
        });
    
        const user_ = await this.db.query.User.findMany({ where: (user,{eq}) => eq(user.id, user.id) });
        const tenant = await this.db.query.Tenant.findMany({ where: (tenant,{eq}) => eq(tenant.id, user_[0].tenantId) });
    
        return {
          user: user_[0],
          tenant: tenant[0],
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
