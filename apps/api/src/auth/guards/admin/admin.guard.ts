import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ADMIN_KEY = 'admin';
export const ADMIN_PERMISSIONS_KEY = 'admin_permissions';

export const RequireAdmin = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(ADMIN_KEY, true, descriptor.value);
    return descriptor;
  };
};

export const RequireAdminPermission = (permission: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(ADMIN_PERMISSIONS_KEY, permission, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireAdmin = this.reflector.getAllAndOverride<boolean>(
      ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermission = this.reflector.getAllAndOverride<string>(
      ADMIN_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireAdmin && !requiredPermission) {
      return true; // No admin requirement
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    this.logger.log('Admin guard - User:', user);
    this.logger.log(`Admin guard - RequireAdmin: ${requireAdmin}, RequiredPermission: ${requiredPermission}`);
    
    if (!user) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('User not authenticated');
    }

    // If specific permission is required, check for that
    if (requiredPermission) {
      this.logger.log(`Checking for specific admin permission: ${requiredPermission}`);
      const hasPermission = this.checkSpecificPermission(user, requiredPermission);
      if (!hasPermission) {
        this.logger.warn(`User ${user.sub} lacks required admin permission: ${requiredPermission}`);
        throw new ForbiddenException(`Admin permission required: ${requiredPermission}`);
      }
      this.logger.log(`User ${user.sub} has required admin permission: ${requiredPermission}`);
      return true;
    }

    // Check if user has general admin privileges
    this.logger.log('Checking for general admin privileges');
    const hasAdminPrivileges = this.checkAdminPrivileges(user);
    
    if (!hasAdminPrivileges) {
      this.logger.warn(`User ${user.sub} does not have admin privileges`);
      throw new ForbiddenException('Admin privileges required');
    }

    this.logger.log(`User ${user.sub} has admin privileges`);
    return true;
  }

  private checkAdminPrivileges(user: any): boolean {
    // Method 1: Check if user has admin role in the special "all" tenant
    if (this.checkSpecialAdminTenant(user)) {
      return true;
    }

    // Method 2: Check if user has admin role in any tenant
    if (this.checkAdminRole(user)) {
      return true;
    }

    // Method 3: Check if user has admin permissions
    if (this.checkAdminPermissions(user)) {
      return true;
    }

    // Method 4: Check if user has system-level admin access
    if (this.checkSystemAdminAccess(user)) {
      return true;
    }

    return false;
  }

  private checkSpecialAdminTenant(user: any): boolean {
    // Check if user has admin role in the special "all" tenant from loginAdmin
    // Admin users get: { "all": [{roleId: 'admin', roleName: 'admin', permissions: ['admin']}] }
    if (user.roles && user.roles.all && Array.isArray(user.roles.all)) {
      for (const role of user.roles.all) {
        if (role.roleName === 'admin' && role.permissions && role.permissions.includes('admin')) {
          this.logger.debug(`User has admin role in special 'all' tenant`);
          return true;
        }
      }
    }
    return false;
  }

  private checkAdminRole(user: any): boolean {
    // Check if user has admin role in any tenant
    if (!user.roles) {
      return false;
    }

    // Look through all tenant roles for admin privileges
    for (const tenantId in user.roles) {
      const tenantRoles = user.roles[tenantId];
      if (Array.isArray(tenantRoles)) {
        for (const role of tenantRoles) {
          // Check if role name contains 'admin'
          if (role.roleName && role.roleName.toLowerCase().includes('admin')) {
            this.logger.debug(`User has admin role: ${role.roleName} in tenant ${tenantId}`);
            return true;
          }
        }
      }
    }

    return false;
  }

  private checkAdminPermissions(user: any): boolean {
    // Check if user has admin permissions in any tenant
    if (!user.roles) {
      return false;
    }

    for (const tenantId in user.roles) {
      const tenantRoles = user.roles[tenantId];
      if (Array.isArray(tenantRoles)) {
        for (const role of tenantRoles) {
          if (role.permissions && Array.isArray(role.permissions)) {
            for (const permission of role.permissions) {
              const perm = permission.toLowerCase();
              if (perm.includes('admin') || 
                  perm.includes('tenant:create') ||
                  perm.includes('tenant:manage') ||
                  perm.includes('system:admin') ||
                  perm.includes('user:manage') ||
                  perm.includes('role:manage')) {
                this.logger.debug(`User has admin permission: ${permission} in tenant ${tenantId}`);
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  }

  private checkSystemAdminAccess(user: any): boolean {
    // This method could be enhanced to check the database for user type
    // For now, we'll check if the user has access to system-level operations
    
    // Check if user has access to multiple tenants (system admin indicator)
    if (user.tenants && user.tenants.length > 1) {
      this.logger.debug(`User has access to multiple tenants: ${user.tenants.length}`);
      return true;
    }

    // Check if user has system-level roles
    if (user.roles) {
      for (const tenantId in user.roles) {
        const tenantRoles = user.roles[tenantId];
        if (Array.isArray(tenantRoles)) {
          for (const role of tenantRoles) {
            if (role.roleName && 
                (role.roleName.toLowerCase().includes('system') || 
                 role.roleName.toLowerCase().includes('super'))) {
              this.logger.debug(`User has system role: ${role.roleName}`);
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  private checkSpecificPermission(user: any, requiredPermission: string): boolean {
    // Check if user has the specific required permission in any tenant
    if (!user.roles) {
      return false;
    }

    const requiredPerm = requiredPermission.toLowerCase();
    
    // First check the special "all" tenant for admin users
    if (user.roles.all && Array.isArray(user.roles.all)) {
      for (const role of user.roles.all) {
        if (role.roleName === 'admin' && role.permissions && role.permissions.includes('admin')) {
          this.logger.debug(`Admin user has all permissions via special 'all' tenant`);
          return true;
        }
      }
    }
    
    // Then check other tenants
    for (const tenantId in user.roles) {
      if (tenantId === 'all') continue; // Skip the special admin tenant
      
      const tenantRoles = user.roles[tenantId];
      if (Array.isArray(tenantRoles)) {
        for (const role of tenantRoles) {
          if (role.permissions && Array.isArray(role.permissions)) {
            for (const permission of role.permissions) {
              const perm = permission.toLowerCase();
              if (perm === requiredPerm || perm.includes(requiredPerm)) {
                this.logger.debug(`User has required permission: ${permission} in tenant ${tenantId}`);
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  }
}
