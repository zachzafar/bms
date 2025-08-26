import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export interface RequiredPermissions {
  permissions: string[];
  requireAll?: boolean; // if true, user must have ALL permissions, if false, user must have ANY permission
}

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (permissions: string[], requireAll: boolean = false) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(PERMISSIONS_KEY, { permissions, requireAll }, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermissions>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'] as string;
    
    this.logger.log('Permissions guard - User:', user);
    this.logger.log('Permissions guard - Tenant ID:', tenantId);
    
    if (!user) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is an admin - admins can do anything
    if (this.isAdminUser(user)) {
      this.logger.log(`User ${user.sub} is an admin - bypassing permission checks`);
      return true;
    }

    if (!tenantId) {
      this.logger.warn('No tenant ID found in request');
      throw new ForbiddenException('Tenant ID required');
    }

    // Check if user has access to this tenant
    // The JWT payload contains: { sub: userId, tenants: string[], roles: Record<string, Array> }
    if (!user.tenants || !user.tenants.includes(tenantId)) {
      this.logger.warn(`User ${user.sub} does not have access to tenant ${tenantId}`);
      throw new ForbiddenException('Access denied to this tenant');
    }

    // Get user permissions for this specific tenant
    const userPermissions = this.getUserPermissionsForTenant(user, tenantId);
    
    if (!userPermissions || userPermissions.length === 0) {
      this.logger.warn(`User ${user.sub} has no permissions in tenant ${tenantId}`);
      throw new ForbiddenException('No permissions found for this tenant');
    }

    const hasPermission = this.checkPermissions(
      userPermissions,
      requiredPermissions.permissions,
      requiredPermissions.requireAll
    );

    if (!hasPermission) {
      this.logger.warn(
        `User ${user.sub} lacks required permissions. Required: ${requiredPermissions.permissions.join(', ')}. User has: ${userPermissions.join(', ')}`
      );
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.permissions.join(', ')}`
      );
    }

    this.logger.log(`User ${user.sub} authorized with permissions: ${userPermissions.join(', ')}`);
    return true;
  }

  private getUserPermissionsForTenant(user: any, tenantId: string): string[] {
    // The JWT payload structure is:
    // roles: { [tenantId]: Array<{ roleId: string; roleName: string; permissions: string[] }> }
    if (!user.roles || !user.roles[tenantId]) {
      this.logger.debug(`No roles found for user ${user.sub} in tenant ${tenantId}`);
      return [];
    }

    const permissions = new Set<string>();
    user.roles[tenantId].forEach((role: any) => {
      if (role.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach((permission: string) => {
          permissions.add(permission);
        });
      }
    });

    this.logger.debug(`User ${user.sub} has permissions in tenant ${tenantId}: ${Array.from(permissions).join(', ')}`);
    return Array.from(permissions);
  }

  private checkPermissions(
    userPermissions: string[],
    requiredPermissions: string[],
    requireAll: boolean = false
  ): boolean {
    if (requireAll) {
      // User must have ALL required permissions
      return requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );
    } else {
      // User must have ANY of the required permissions
      return requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );
    }
  }

  private isAdminUser(user: any): boolean {
    // Check if user is an admin based on the JWT structure from loginAdmin
    // Admin users get: { "all": [{roleId: 'admin', roleName: 'admin', permissions: ['admin']}] }
    if (!user || !user.roles) {
      return false;
    }

    // Check if user has admin role in the "all" tenant (special admin tenant)
    if (user.roles.all && Array.isArray(user.roles.all)) {
      for (const role of user.roles.all) {
        if (role.roleName === 'admin' && role.permissions && role.permissions.includes('admin')) {
          return true;
        }
      }
    }

    // Also check for admin role in any other tenant
    for (const tenantId in user.roles) {
      if (tenantId === 'all') continue; // Skip the special admin tenant
      
      const tenantRoles = user.roles[tenantId];
      if (Array.isArray(tenantRoles)) {
        for (const role of tenantRoles) {
          if (role.roleName === 'admin' || 
              (role.permissions && role.permissions.includes('admin'))) {
            return true;
          }
        }
      }
    }

    return false;
  }
}
