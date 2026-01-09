import { Inject, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { InsertTenant, InsertUser, SelectTenant, SelectUser } from '@repo/api-contract';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { ConfigType } from '@nestjs/config';
import refreshConfig from './config/refresh.config';
import { UsersService } from 'src/users/users.service';
import { eq, desc, and, sql } from 'drizzle-orm';
import { getAllScopes } from './permissions';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomBytes } from 'crypto';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    @Inject(refreshConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshConfig>,
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
    private readonly eventEmitter: EventEmitter2
  ) { }

  async createTenantWithAdmin(tenantData: InsertTenant, userData: Omit<InsertUser, "tenantId" | "role">): Promise<{ tenantId: string; userId: string; }> {
    let tenantId: string = ""
    let userId: string = ""

    try {
      await this.db.transaction(async (tx) => {
        this.logger.log('Creating a tenant');
        let result = await tx.insert(schema.Tenant).values({ ...tenantData, subdomain: null }).$returningId()
        tenantId = result[0].id;
        const hashedPassword = await hash(userData.password);
        this.logger.log('Creating a user');
        result = await tx.insert(schema.User).values({
          ...userData,
          password: hashedPassword,
        }).$returningId()
        userId = result[0].id;

        this.logger.log('Creating a tenant user relationship');
        await tx.insert(schema.TenantHasUsers).values({
          tenantId,
          userId
        })

      });
    } catch (error) {
      throw new InternalServerErrorException(`Error occured while creating tenant: ${error}`,);
    }


    return {
      userId,
      tenantId,
    }
  }

  async loginAdmin(email: string, password: string) {
    const user_ = await this.db.query.User.findFirst({ where: (user, { eq }) => eq(user.email, email) })
    if (!user_) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user_.userType != 'admin') {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await verify(user_.password, password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const { accessToken, refreshToken } = await this.generateTokens(
      user_.id, 
      [], 
      {
        "all": [{roleId: 'admin', roleName: 'admin', permissions: ['admin']}]
      }
    );
  
    const hashedToken = await hash(refreshToken);
    await this.db.insert(schema.refreshTokens).values({
      userId: user_.id,
      refreshToken: hashedToken,
    });
  
    const { password: _, ...user } = user_;
  
    return {
      user,
      tenants: [],
      accessToken,
      refreshToken,
    };


  }

  async login(email: string, password: string): Promise<{ user: Omit<SelectUser, "password" | "roles">; tenants: SelectTenant[]; accessToken: string; refreshToken: string }> {
    let user_ = await this.db.query.User.findFirst({ where: (user, { eq }) => eq(user.email, email) })

   
  
    if (!user_) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user_.userType =='admin') return this.loginAdmin(email, password);
  
    if (!user_.userType.includes("system")) {
      throw new UnauthorizedException('Invalid email or password');
    }
  
    let tenantHasUsers = await this.db.select().from(schema.TenantHasUsers).where(eq(schema.TenantHasUsers.userId, user_.id))
    console.log(tenantHasUsers)
    let tenants = await this.db.query.Tenant.findMany({
      where: (tenant, { inArray }) => inArray(
        tenant.id,
        tenantHasUsers.map(tenantHasUser => tenantHasUser.tenantId)
      )
    })
    
  
    const isValid = await verify(user_.password, password);
  
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
  
    // NEW: Get user roles and permissions for each tenant
    const tenantRolesAndPermissions = await this.getUserRolesAndPermissions(user_.id, tenants.map(t => t.id));
  
    const { accessToken, refreshToken } = await this.generateTokens(
      user_.id, 
      tenants.map(tenant => tenant.id), 
      tenantRolesAndPermissions
    );
  
    const hashedToken = await hash(refreshToken);
    await this.db.insert(schema.refreshTokens).values({
      userId: user_.id,
      refreshToken: hashedToken,
    });
  
    const { password: _, ...user } = user_;
    this.logger.log(`Tenants: ${tenants}`)
    return {
      user,
      tenants,
      accessToken,
      refreshToken,
    };
  }

  async getUserPermissionsForTenant(userId:string, tenantId:string): Promise<string[]> {

    const userRoles = await this.db.select(
      {
        permission: schema.RoleHasPermissions.permission
      }
    )
    .from(schema.UserHasRoles)
    .where(and(
      eq(schema.UserHasRoles.userId,userId),
      eq(schema.UserHasRoles.tenantId,tenantId)
    ))
    .innerJoin(schema.Roles, eq(schema.UserHasRoles.roleId, schema.Roles.id))
    .leftJoin(schema.RoleHasPermissions, eq(schema.Roles.id, schema.RoleHasPermissions.roleId));

    const permissions = new Set<string>()

    userRoles.map(role => {
      if (role.permission)
      permissions.add(role.permission)
    })

    return Array.from(permissions)
  }
  
  // NEW: Helper method to get user roles and permissions per tenant
  async getUserRolesAndPermissions(userId: string, tenantIds: string[]) {
    const result: Record<string, Array<{ roleId: string; roleName: string; permissions: string[] }>> = {};
    
    for (const tenantId of tenantIds) {
      // Get user roles for this tenant
      const userRoles = await this.db.select({
        roleId: schema.UserHasRoles.roleId,
        roleName: schema.Roles.name,
        permission: schema.RoleHasPermissions.permission
      })
      .from(schema.UserHasRoles)
      .where(and(
        eq(schema.UserHasRoles.userId, userId),
        eq(schema.UserHasRoles.tenantId, tenantId)
      ))
      .innerJoin(schema.Roles, eq(schema.UserHasRoles.roleId, schema.Roles.id))
      .leftJoin(schema.RoleHasPermissions, eq(schema.Roles.id, schema.RoleHasPermissions.roleId));
  
      // Group permissions by role
      const roleMap = new Map<string, { roleId: string; roleName: string; permissions: string[] }>();
      
      userRoles.forEach(row => {
        const roleId = String(row.roleId);
        if (!roleMap.has(roleId)) {
          roleMap.set(roleId, {
            roleId,
            roleName: row.roleName,
            permissions: []
          });
        }
        if (row.permission) {
          roleMap.get(roleId)!.permissions.push(row.permission);
        }
      });
  
      result[tenantId] = Array.from(roleMap.values());
    }
    
    return result;
  }

  async registerAdmin(userData: {name: string, email: string}) {
    try {
      // Check if email domain is whitelisted for admin registration
      const emailDomain = userData.email.split('@')[1];
      if (emailDomain !== 'tradewindstudio.dev') {
        throw new UnauthorizedException('Domain not authorized for admin registration');
      }

      // Check if user already exists
      const existingUser = await this.db.query.User.findFirst({
        where: (user, { eq }) => eq(user.email, userData.email),
      });

      if (existingUser) {
        throw new UnauthorizedException('User already exists');
      }

      // Create user with temporary password and SYSADMIN role
      const hashedPassword = await hash('temp_password_' + Date.now());
      const [newUser] = await this.db.insert(schema.User).values({
        ...userData,
        password: hashedPassword,
        userType: 'admin'
      }).$returningId();

      // Create password reset token for the new admin
      const resetToken = `rk_${randomBytes(32).toString('hex')}`;
      const expiresAt = new Date(Date.now() + 24 * 3600000); // 24 hours

      await this.db.insert(schema.PasswordReset).values({
        userId: newUser.id,
        token: resetToken,
        expiresAt,
      });

      // Emit event to send welcome email with password setup link
      this.eventEmitter.emit('admin.registered', {
        email: userData.email,
        token: resetToken,
        expiresAt,
        userId: newUser.id,
        name: userData.name,
      });

      this.logger.log(`Admin user registered: ${userData.email}`);
      return { userId: newUser.id, email: userData.email };
    } catch (error) {
      this.logger.error(`Error registering admin: ${error}`);
      throw error;
    }
  }

  async validateAdminToken(token: string): Promise<boolean> {
    try {
      // Decode and verify the JWT token
      const payload = this.jwtService.verify(token);
      
      if (!payload || !payload.sub) {
        return false;
      }

      // Check if the user exists and is an admin
      const user = await this.db.query.User.findFirst({
        where: (user, { eq }) => eq(user.id, payload.sub),
      });

      if (!user) {
        return false;
      }

      // Check if user is an admin
      if (user.userType !== 'admin') {
        return false;
      }

      // Additional check: verify the token structure has admin roles
      if (payload.roles && payload.roles.all) {
        const adminRole = payload.roles.all.find((role: any) => 
          role.roleName === 'admin' && role.permissions && role.permissions.includes('admin')
        );
        
        if (adminRole) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Admin token validation error: ${error}`);
      return false;
    }
  }

  async logout(userId: string) {
    const rows = await this.db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, userId));
  }

  async validateLocalUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException('User not found!');
    const isPasswordMatched = verify(user.password, password);
    if (!isPasswordMatched)
      throw new UnauthorizedException('Invalid Credentials!');

    return { id: user.id, name: user.name, };
  }

  async validateJwtUser(userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) throw new UnauthorizedException('User not found!');
    return { id: user.id, name: user.name };
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
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
      await this.logout(userId);
      throw new UnauthorizedException('Refresh Token Expired!');
    }
    console.log("returning user")
    const currentUser = { id: userId };
    return currentUser;
  }

  async refreshToken(userId: string) {

    let tenantHasUsers = await this.db.select().from(schema.TenantHasUsers).where(eq(schema.TenantHasUsers.userId, userId))

    let tenants = await this.db.query.Tenant.findMany({
      where: (tenant, { inArray }) => inArray(
        tenant.id,
        tenantHasUsers.map(tenantHasUser => tenantHasUser.tenantId)
      )
    })

    const tenantRolesAndPermissions = await this.getUserRolesAndPermissions(userId, tenants.map(t => t.id));

    const { accessToken, refreshToken } = await this.generateTokens(userId,tenants.map(tenant => tenant.id),tenantRolesAndPermissions);

    const hashedToken = await hash(refreshToken);

    await this.db.update(schema.refreshTokens).set({ refreshToken: hashedToken, }).where(eq(schema.refreshTokens.userId, userId));

    const user_ = await this.db.query.User.findMany({ where: (user, { eq }) => eq(user.id, userId) });

    return {
      user: user_[0],
      accessToken,
      refreshToken,
    };
  }

  async generateTokens(
    userId: string, 
    tenants: string[], 
    tenantRolesAndPermissions: Record<string, Array<{ roleId: string; roleName: string; permissions: string[] }>>
  ) {
    // Minimize payload to reduce token size:
    // - Remove roles from token; resolve roles server-side using `sub`
    // - Use a shorter claim name for tenants ("t")
    const accessPayload = { 
      sub: userId, 
      t: tenants 
    };

    // Keep refresh token minimal; add jti if you want revocation tracking
    const refreshPayload = { 
      sub: userId 
      // jti: someGeneratedId, // optional: add if you implement server-side revocation
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload /*, { noTimestamp: true } */),
      this.jwtService.signAsync(refreshPayload, this.refreshTokenConfig /* { noTimestamp: true } */)
    ]);

    return { accessToken, refreshToken };
  }


  async createRole(tenantId: string, roleName: string, permissions: string[]) {
    let roleId: number = 0
    await this.db.transaction(async (tx) => {
      this.logger.log('Creating a role');
      let [{ id }] = await tx.insert(schema.Roles).values({
        tenantId,
        name: roleName,
      }).$returningId()
      roleId = id;
      this.logger.log('Creating a role permissions relationship');
      await tx.insert(schema.RoleHasPermissions).values(permissions.map(permission => ({
        roleId: (roleId),
        permission
      })))
    });

    return roleId;
  }


  async updateRole(tenantId: string, roleId:number, roleName: string, permissions: string[]) {
    await this.db.transaction(async (tx) => {
      this.logger.log('Updating a role');
      await tx.update(schema.Roles).set({
        name: roleName,
      }).where(eq(schema.Roles.id, (roleId)))
      this.logger.log('Updating a role permissions relationship');
      await tx.delete(schema.RoleHasPermissions).where(eq(schema.RoleHasPermissions.roleId, (roleId)))
      await tx.insert(schema.RoleHasPermissions).values(permissions.map(permission => ({
        roleId: (roleId),
        permission
      })))
    })

    return true
  }

  async deleteRole(tenantId: string, roleId: number) {
    await this.db.transaction(async (tx) => {
    // First remove the role from the junction table
    await tx.delete(schema.RoleHasPermissions).where(
      eq(schema.RoleHasPermissions.roleId, (roleId))
    );
    await tx.delete(schema.Roles).where(eq(schema.Roles.id, (roleId)));
})
}

  async getPermissions() {
    return getAllScopes();
  }

  async getRoles(tenantId: string, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Roles)
      .where(eq(schema.Roles.tenantId, tenantId))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    const results = await this.db.query.Roles.findMany({
      where: (role, { eq }) => eq(role.tenantId, tenantId),
      with: {
        rolesToPermissions: true
      },
      limit: pageSize,
      offset: offset,
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
      data: results,
      pagination: paginationData,
    };
  }

  

}
