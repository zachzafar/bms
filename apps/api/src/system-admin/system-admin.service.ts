import { Injectable, Logger, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { eq, and, count, countDistinct, desc, isNull, sql, like, notInArray } from 'drizzle-orm';
import { hash } from 'argon2';
import { randomBytes } from 'crypto';
import { UsersService } from 'src/users/users.service';
import { promises as fs} from "fs";
import * as schema from '@repo/api-contract';

@Injectable()
export class SystemAdminService {
  private readonly logger = new Logger(SystemAdminService.name);

  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
    private readonly userService: UsersService,
  ) {}

  // System Admin User Management
  async createSystemAdmin(name: string, email: string, password: string) {
    try {
      // Check if user already exists
      const existingUser = await this.db.query.User.findFirst({
        where: (user, { eq }) => eq(user.email, email)
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await hash(password);

      // Create user
      const [user] = await this.db.insert(schema.User).values({
        name,
        email,
        password: hashedPassword,
        userType: 'system',
      }).$returningId();

      this.logger.log(`Created system admin user: ${user.id}`);
      return { userId: user.id, message: 'System admin user created successfully' };
    } catch (error: any) {
      this.logger.error(`Failed to create system admin: ${error.message}`);
      throw error;
    }
  }

  async getSystemAdmins(page: number = 1, pageSize: number = 10) {
    try {
      const offset = (page - 1) * pageSize;

      const totalCountResult = await this.db
        .select({ count: count() })
        .from(schema.User)
        .where(eq(schema.User.userType, 'system'));
      const totalCount = totalCountResult[0]?.count || 0;

      const users = await this.db.query.User.findMany({
        where: (user, { eq }) => eq(user.userType, 'system'),
        columns: {
          password: false,
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
        data: users.map(user => ({
          ...user,
          roles: [] // System admins don't have tenant-specific roles
        })),
        pagination: paginationData,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get system admins: ${error.message}`);
      throw error;
    }
  }

  // Tenant Management
  async createTenant(tenantData: any, adminUserData: any) {
    try {
      // Check if tenant with subdomain already exists
      if (tenantData.subdomain) {
        const existingTenant = await this.db.query.Tenant.findFirst({
          where: (tenant, { eq }) => eq(tenant.subdomain, tenantData.subdomain)
        });

        if (existingTenant) {
          throw new ConflictException('Tenant with this subdomain already exists');
        }
      }

      // Check if admin user email already exists
      const existingUser = await this.db.query.User.findFirst({
        where: (user, { eq }) => eq(user.email, adminUserData.email)
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash admin user password
      const hashedPassword = await hash(adminUserData.password);

      // Create tenant and admin user in transaction
      const result = await this.db.transaction(async (tx) => {
        // Create tenant
        const [tenant] = await tx.insert(schema.Tenant).values(tenantData).$returningId();

        // Create admin user
        const [adminUser] = await tx.insert(schema.User).values({
          ...adminUserData,
          password: hashedPassword,
          userType: 'system',
        }).$returningId();

        // Create tenant-user relationship
        await tx.insert(schema.TenantHasUsers).values({
          tenantId: tenant.id,
          userId: adminUser.id,
          isAdmin: true,
        });

        // Create default admin role
        const [adminRole] = await tx.insert(schema.Roles).values({
          name: 'Tenant Admin',
          description: 'Administrative access within the tenant',
          tenantId: tenant.id,
        }).$returningId();

        // Assign admin role to admin user
        await tx.insert(schema.UserHasRoles).values({
          roleId: adminRole.id,
          userId: adminUser.id,
          tenantId: tenant.id,
        });

        // Add basic permissions to admin role
        const basicPermissions = [
          'users:read', 'users:write', 'users:delete',
          'roles:read', 'roles:write', 'roles:delete',
          'tenant:admin', 'assets:read', 'assets:write'
        ];

        await tx.insert(schema.RoleHasPermissions).values(
          basicPermissions.map(permission => ({
            roleId: adminRole.id,
            permission,
          }))
        );

        return { tenantId: tenant.id, adminUserId: adminUser.id };
      });

      this.logger.log(`Created tenant: ${result.tenantId} with admin user: ${result.adminUserId}`);
      return { ...result, message: 'Tenant created successfully with admin user' };
    } catch (error: any) {
      this.logger.error(`Failed to create tenant: ${error.message}`);
      throw error;
    }
  }

  async updateTenant(tenantId: string, tenantData: schema.UpdateTenant) {
    try {
      const existingTenant = await this.db.query.Tenant.findFirst({
        where: (tenant, { eq }) => eq(tenant.id, tenantId)
      });

      if (!existingTenant) {
        throw new NotFoundException('Tenant not found');
      }
      const { subdomain } = tenantData
      // Check subdomain uniqueness if updating
      if (subdomain && subdomain !== existingTenant.subdomain) {
        const duplicateTenant = await this.db.query.Tenant.findFirst({
          where: (tenant, { eq }) => eq(tenant.subdomain, subdomain)
        });

        if (duplicateTenant) {
          throw new ConflictException('Tenant with this subdomain already exists');
        }
      }

      await this.db.update(schema.Tenant)
        .set(tenantData)
        .where(eq(schema.Tenant.id, tenantId));

      this.logger.log(`Updated tenant: ${tenantId}`);
      return { message: 'Tenant updated successfully' };
    } catch (error: any) {
      this.logger.error(`Failed to update tenant: ${error.message}`);
      throw error;
    }
  }

  async deleteTenant(tenantId: string) {
    try {
      const existingTenant = await this.db.query.Tenant.findFirst({
        where: (tenant, { eq }) => eq(tenant.id, tenantId)
      });

      if (!existingTenant) {
        throw new NotFoundException('Tenant not found');
      }

      // Soft delete the tenant
      await this.db
        .update(schema.Tenant)
        .set({ deletedAt: new Date() })
        .where(eq(schema.Tenant.id, tenantId));

      this.logger.log(`Deleted tenant: ${tenantId}`);
      return { message: 'Tenant deleted successfully' };
    } catch (error: any) {
      this.logger.error(`Failed to delete tenant: ${error.message}`);
      throw error;
    }
  }

  async getTenants(page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const totalCountResult = await this.db
      .select({ count: count() })
      .from(schema.Tenant)
      .where(isNull(schema.Tenant.deletedAt));
    const totalCount = totalCountResult[0]?.count || 0;

    const results = await this.db.query.Tenant.findMany({
      where: (t, { isNull }) => isNull(t.deletedAt),
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

  async getTenant(tenantId: string) {
    try {
      const tenant = await this.db.query.Tenant.findFirst({
        where: (t, { eq, and, isNull }) => and(eq(t.id, tenantId), isNull(t.deletedAt))
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      // Get counts
      const [userCountResult] = await this.db
        .select({ count: count() })
        .from(schema.TenantHasUsers)
        .where(eq(schema.TenantHasUsers.tenantId, tenantId));

      const [roleCountResult] = await this.db
        .select({ count: count() })
        .from(schema.Roles)
        .where(and(eq(schema.Roles.tenantId, tenantId), isNull(schema.Roles.deletedAt)));

      const [apiKeyCountResult] = await this.db
        .select({ count: count() })
        .from(schema.APIKeys)
        .where(eq(schema.APIKeys.tenantId, tenantId));

      return {
        tenant,
        userCount: userCountResult.count,
        roleCount: roleCountResult.count,
        apiKeyCount: apiKeyCountResult.count,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get tenant details: ${error.message}`);
      throw error;
    }
  }

  // Role Management
  async createTenantRole(tenantId: string, name: string, description: string | undefined, permissions: string[]) {
    try {
      // Verify tenant exists
      const tenant = await this.db.query.Tenant.findFirst({
        where: (t, { eq }) => eq(t.id, tenantId)
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      // Check if role name already exists for this tenant
      const existingRole = await this.db.query.Roles.findFirst({
        where: (role, { and, eq }) => and(
          eq(role.tenantId, tenantId),
          eq(role.name, name)
        )
      });

      if (existingRole) {
        throw new ConflictException('Role with this name already exists for this tenant');
      }

      // Create role and permissions in transaction
      const result = await this.db.transaction(async (tx) => {
        const [role] = await tx.insert(schema.Roles).values({
          name,
          description,
          tenantId,
        }).$returningId();

        // Add permissions
        if (permissions.length > 0) {
          await tx.insert(schema.RoleHasPermissions).values(
            permissions.map(permission => ({
              roleId: role.id,
              permission,
            }))
          );
        }

        return { roleId: (role.id) }; // Convert to number as expected by contract
      });

      this.logger.log(`Created role: ${result.roleId} for tenant: ${tenantId}`);
      return { ...result, message: 'Role created successfully' };
    } catch (error: any) {
      this.logger.error(`Failed to create role: ${error.message}`);
      throw error;
    }
  }

  async updateTenantRole(tenantId: string, roleId: number, name: string, description: string | undefined, permissions: string[]) {
    try {
      // Verify role exists and belongs to tenant
      const role = await this.db.query.Roles.findFirst({
        where: (r, { and, eq }) => and(
          eq(r.id, (roleId)),
          eq(r.tenantId, tenantId)
        )
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Check if new name conflicts with existing role
      if (name !== role.name) {
        const existingRole = await this.db.query.Roles.findFirst({
          where: (r, { and, eq }) => and(
            eq(r.tenantId, tenantId),
            eq(r.name, name),
            sql`${r.id} != ${roleId}`
          )
        });

        if (existingRole) {
          throw new ConflictException('Role with this name already exists for this tenant');
        }
      }

      // Update role and permissions in transaction
      await this.db.transaction(async (tx) => {
        // Update role
        await tx.update(schema.Roles)
          .set({ name, description })
          .where(eq(schema.Roles.id, (roleId)));

        // Delete existing permissions
        await tx.delete(schema.RoleHasPermissions)
          .where(eq(schema.RoleHasPermissions.roleId, (roleId)));

        // Add new permissions
        if (permissions.length > 0) {
          await tx.insert(schema.RoleHasPermissions).values(
            permissions.map(permission => ({
              roleId: (roleId),
              permission,
            }))
          );
        }
      });

      this.logger.log(`Updated role: ${roleId} for tenant: ${tenantId}`);
      return { message: 'Role updated successfully' };
    } catch (error: any) {
      this.logger.error(`Failed to update role: ${error.message}`);
      throw error;
    }
  }

  async deleteTenantRole(tenantId: string, roleId: number) {
    try {
      // Verify role exists and belongs to tenant
      const role = await this.db.query.Roles.findFirst({
        where: (r, { and, eq }) => and(
          eq(r.id, (roleId)),
          eq(r.tenantId, tenantId)
        )
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Check if role is assigned to any users
      const userRoles = await this.db.query.UserHasRoles.findMany({
        where: (uhr, { and, eq }) => and(
          eq(uhr.roleId, (roleId)),
          eq(uhr.tenantId, tenantId)
        )
      });

      if (userRoles.length > 0) {
        throw new ConflictException('Cannot delete role that is assigned to users');
      }

      // Soft delete the role
      await this.db
        .update(schema.Roles)
        .set({ deletedAt: new Date() })
        .where(eq(schema.Roles.id, roleId));

      this.logger.log(`Deleted role: ${roleId} for tenant: ${tenantId}`);
      return { message: 'Role deleted successfully' };
    } catch (error: any) {
      this.logger.error(`Failed to delete role: ${error.message}`);
      throw error;
    }
  }

  async getTenantRoles(tenantId: string) {
    try {
      const roles = await this.db.query.Roles.findMany({
        where: (role, { eq }) => eq(role.tenantId, tenantId),
        with: {
          rolesToPermissions: true,
        }
      });

      // Get user count for each role
      const rolesWithUserCount = await Promise.all(
        roles.map(async (role) => {
          const [userCountResult] = await this.db
            .select({ count: count() })
            .from(schema.UserHasRoles)
            .where(and(
              eq(schema.UserHasRoles.roleId, (role.id)),
              eq(schema.UserHasRoles.tenantId, tenantId)
            ));

          return {
            id: (role.id), // Convert to number as expected by contract
            name: role.name,
            description: role.description,
            permissions: role.rolesToPermissions.map(rp => rp.permission),
            userCount: userCountResult.count,
          };
        })
      );

      return rolesWithUserCount;
    } catch (error: any) {
      this.logger.error(`Failed to get tenant roles: ${error.message}`);
      throw error;
    }
  }

  // User Assignment to Tenants
  async assignUserToTenant(tenantId: string, userId: string, roleIds: number[], isAdmin: boolean = false) {
    try {
      // Verify tenant exists
      const tenant = await this.db.query.Tenant.findFirst({
        where: (t, { eq }) => eq(t.id, tenantId)
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      // Verify user exists
      const user = await this.db.query.User.findFirst({
        where: (u, { eq }) => eq(u.id, userId)
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify roles exist and belong to tenant
      for (const roleId of roleIds) {
        const role = await this.db.query.Roles.findFirst({
          where: (r, { and, eq }) => and(
            eq(r.id, roleId),
            eq(r.tenantId, tenantId)
          )
        });

        if (!role) {
          throw new NotFoundException(`Role ${roleId} not found for this tenant`);
        }
      }

      // Check if user is already assigned to this tenant
      const existingAssignment = await this.db.query.TenantHasUsers.findFirst({
        where: (thu, { and, eq }) => and(
          eq(thu.tenantId, tenantId),
          eq(thu.userId, userId)
        )
      });

      if (existingAssignment) {
        throw new ConflictException('User is already assigned to this tenant');
      }

      // Assign user to tenant and roles in transaction
      await this.db.transaction(async (tx) => {
        // Create tenant-user relationship
        await tx.insert(schema.TenantHasUsers).values({
          tenantId,
          userId,
          isAdmin,
        });

        // Assign roles
        for (const roleId of roleIds) {
          await tx.insert(schema.UserHasRoles).values({
            roleId: (roleId),
            userId,
            tenantId,
          });
        }
      });

      this.logger.log(`Assigned user: ${userId} to tenant: ${tenantId} with roles: ${roleIds}`);
      return { message: 'User assigned to tenant successfully' };
    } catch (error: any) {
      this.logger.error(`Failed to assign user to tenant: ${error.message}`);
      throw error;
    }
  }

  async removeUserFromTenant(tenantId: string, userId: string) {
    try {
      // Check if assignment exists
      const assignment = await this.db.query.TenantHasUsers.findFirst({
        where: (thu, { and, eq }) => and(
          eq(thu.tenantId, tenantId),
          eq(thu.userId, userId)
        )
      });

      if (!assignment) {
        throw new NotFoundException('User is not assigned to this tenant');
      }

      // Remove user from tenant and roles in transaction
      await this.db.transaction(async (tx) => {
        // Remove role assignments
        await tx.delete(schema.UserHasRoles)
          .where(and(
            eq(schema.UserHasRoles.tenantId, tenantId),
            eq(schema.UserHasRoles.userId, userId)
          ));

        // Remove tenant assignment
        await tx.delete(schema.TenantHasUsers)
          .where(and(
            eq(schema.TenantHasUsers.tenantId, tenantId),
            eq(schema.TenantHasUsers.userId, userId)
          ));
      });

      this.logger.log(`Removed user: ${userId} from tenant: ${tenantId}`);
      return { message: 'User removed from tenant successfully' };
    } catch (error: any) {
      this.logger.error(`Failed to remove user from tenant: ${error.message}`);
      throw error;
    }
  }

  async getTenantUsers(tenantId: string) {
    try {
      const tenantUsers = await this.db.query.TenantHasUsers.findMany({
        where: (thu, { eq }) => eq(thu.tenantId, tenantId),
        with: {
          user: true
        }
      });

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        tenantUsers.map(async (tu) => {
          const userRoles = await this.db.query.UserHasRoles.findMany({
            where: (uhr, { and, eq }) => and(
              eq(uhr.tenantId, tenantId),
              eq(uhr.userId, tu.userId)
            ),
            with: {
              role: true,

            }
          });

          return {
            user: {
              ...tu.user as any,
              roles: [] // The user schema expects roles as number[], not role objects
            },
            roles: userRoles.map(ur => ({
              id: (ur.role.id), // Convert  to number
              name: ur.role.name,
            })),
            isAdmin: tu.isAdmin || false, // Ensure boolean, not null
            assignedAt: new Date().toISOString(), // Since createdAt is not in the schema, use current date
          };
        })
      );

      return usersWithRoles;
    } catch (error: any) {
      this.logger.error(`Failed to get tenant users: ${error.message}`);
      throw error;
    }
  }

  // API Key Management
  async createTenantApiKey(tenantId: string, name: string, scopes: string[] = []) {
    try {
      // Verify tenant exists
      const tenant = await this.db.query.Tenant.findFirst({
        where: (t, { eq }) => eq(t.id, tenantId)
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      // Generate API key
      const apiKey = `ak_${randomBytes(32).toString('hex')}`;

      // Create API key
      const [key] = await this.db.insert(schema.APIKeys).values({
        key: apiKey,
        name,
        scopes,
        tenantId,
        isActive: true,
      }).$returningId();

      this.logger.log(`Created API key: ${key.id} for tenant: ${tenantId}`);
      return { apiKey, message: 'API key created successfully' };
    } catch (error: any) {
      this.logger.error(`Failed to create API key: ${error.message}`);
      throw error;
    }
  }

  async getTenantApiKeys(tenantId: string) {
    try {
      const keys = await this.db.query.APIKeys.findMany({
        where: (key, { eq }) => eq(key.tenantId, tenantId),
        orderBy: [desc(schema.APIKeys.createdAt)]
      });

      return keys.map(key => ({
        id: key.id,
        name: key.name,
        key: key.key,
        scopes: key.scopes || [], // Ensure scopes is always an array
        isActive: key.isActive || false, // Ensure boolean, not null
        createdAt: key.createdAt ? new Date(key.createdAt).toISOString() : new Date().toISOString(), // Convert to string
        lastUsed: key.updatedAt ? new Date(key.updatedAt).toISOString() : null, // Convert to string or null
      }));
    } catch (error: any) {
      this.logger.error(`Failed to get tenant API keys: ${error.message}`);
      throw error;
    }
  }

  async deleteTenantApiKey(tenantId: string, keyId: string) {
    try {
      const key = await this.db.query.APIKeys.findFirst({
        where: (k, { and, eq }) => and(
          eq(k.id, keyId),
          eq(k.tenantId, tenantId)
        )
      });

      if (!key) {
        throw new NotFoundException('API key not found');
      }

      await this.db.delete(schema.APIKeys)
        .where(and(
          eq(schema.APIKeys.id, keyId),
          eq(schema.APIKeys.tenantId, tenantId)
        ));

      this.logger.log(`Deleted API key: ${keyId} for tenant: ${tenantId}`);
      return { message: 'API key deleted successfully' };
    } catch (error: any) {
      this.logger.error(`Failed to delete API key: ${error.message}`);
      throw error;
    }
  }

  // System-wide operations
  async getSystemStats() {
    try {
      const [totalTenants] = await this.db
        .select({ count: count() })
        .from(schema.Tenant);

      const [totalUsers] = await this.db
        .select({ count: count() })
        .from(schema.User);

      const [totalSystemAdmins] = await this.db
        .select({ count: count() })
        .from(schema.User)
        .where(eq(schema.User.userType, 'system'));

      const [totalApiKeys] = await this.db
        .select({ count: count() })
        .from(schema.APIKeys);

      // Count active tenants (those with users)
      const [activeTenants] = await this.db
        .select({ count: countDistinct(schema.TenantHasUsers.tenantId) })
        .from(schema.TenantHasUsers);
        
        this.logger.log("System stats: ", {
          totalTenants,
          totalUsers,
          totalSystemAdmins,
          activeTenants,
          totalApiKeys,
        });
      return {
        totalTenants: totalTenants.count,
        totalUsers: totalUsers.count,
        totalSystemAdmins: totalSystemAdmins.count,
        activeTenants: activeTenants.count,
        totalApiKeys: totalApiKeys.count,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get system stats: ${error.message}`);
      throw error;
    }
  }

  async getSystemLogs(level?: string, startDate?: Date, endDate?: Date, limit: number = 50, offset: number = 0) {
    try {
      // This would typically query a logging table or external logging service
      // For now, return mock data structure
      return [];
    } catch (error: any) {
      this.logger.error(`Failed to get system logs: ${error.message}`);
      throw error;
    }
  }

  async getTenantAssets(tenantId: string, page: number = 1, pageSize: number = 10) {
    try {
      const offset = (page - 1) * pageSize;

      // Get total count
      const totalCountResult = await this.db
        .select({ count: count() })
        .from(schema.Asset)
        .where(and(eq(schema.Asset.tenantId, tenantId), isNull(schema.Asset.deletedAt)));
      const totalCount = totalCountResult[0]?.count || 0;

      // Get assets
      const assets = await this.db.query.Asset.findMany({
        where: (asset, { eq, and, isNull }) => and(
          eq(asset.tenantId, tenantId),
          isNull(asset.deletedAt)
        ),
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
        data: assets,
        pagination: paginationData,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get tenant assets: ${error.message}`);
      throw error;
    }
  }

  // async searchUsers(email?: string, excludeTenantId?: string) {
  //   try {
  //     // Get users not already assigned to the specified tenant
  //     let usersNotInTenant: string[] = [];

  //     if (excludeTenantId) {
  //       const tenantUsers = await this.db.query.TenantHasUsers.findMany({
  //         where: (thu, { eq }) => eq(thu.tenantId, excludeTenantId),
  //       });
  //       usersNotInTenant = tenantUsers.map(tu => tu.userId);
  //     }

  //     const users = await this.db.query.User.findMany({
  //       where: (user, { and, like, notInArray }) => {
  //         const conditions = [];

  //         if (email) {
  //           conditions.push(like(user.email, `%${email}%`));
  //         }

  //         if (usersNotInTenant.length > 0) {
  //           conditions.push(notInArray(user.id, usersNotInTenant));
  //         }

  //         return conditions.length > 0 ? and(...conditions) : undefined;
  //       },
  //       columns: {
  //         password: false,
  //       },
  //       limit: 20,
  //     });

  //     return { data: users };
  //   } catch (error: any) {
  //     this.logger.error(`Failed to search users: ${error.message}`);
  //     throw error;
  //   }
  // }

}
