import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from 'src/auth/auth.service';
import { ROLES_KEY } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionScope[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'] as string;

    if (!user) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('User not authenticated');
    }

    const userId = user.id ?? user.sub; // ✅ support both id or sub

    this.logger.log(`Permissions guard - User ID: ${userId}`);
    this.logger.log(`Permissions guard - Tenant ID: ${tenantId}`);

    if (!tenantId) {
      this.logger.warn('No tenant ID found in request');
      throw new ForbiddenException('Tenant ID required');
    }

    if (!user.tenants || !user.tenants.includes(tenantId)) {
      this.logger.warn(`User ${userId} does not have access to tenant ${tenantId}`);
      throw new ForbiddenException('Access denied to this tenant');
    }

    return this.userHasPermissions(userId, tenantId, requiredPermissions);
  }

  private async userHasPermissions(
    userId: string,
    tenantId: string,
    requiredPermissions: string[]
  ): Promise<boolean> {
    const permissions = await this.authService.getUserPermissionsForTenant(userId, tenantId);

    this.logger.debug(`User ${userId} has permissions in tenant ${tenantId}: ${permissions.join(', ')}`);

    const hasPermission = requiredPermissions.every(permission => permissions.includes(permission));

    if (!hasPermission) {
      this.logger.warn(
        `User ${userId} lacks required permissions. Required: ${requiredPermissions.join(', ')}. User has: ${permissions.join(', ')}`
      );
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`
      );
    }

    this.logger.log(`User ${userId} authorized with permissions: ${permissions.join(', ')}`);
    return true;
  }
}
