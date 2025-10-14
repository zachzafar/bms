import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from 'src/auth/auth.service';
import { ROLES_KEY } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { KeysService } from 'src/keys/keys.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly keysService: KeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 🔑 Check API key first
    const apiKey = request.headers['x-api-key'] as string;
    if (apiKey && await this.keysService.isValidKey(apiKey)) {
      this.logger.log('Request authorized via API Key');
      return true; // bypass tenant/user permissions
    }

    // ⬇️ Normal JWT + permissions flow
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionScope[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions required, allow
    if (!requiredPermissions) return true;

    const user = request.user;
    const tenantId = request.headers['x-tenant-id'] as string;

    if (!user) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('User not authenticated');
    }

    const userId = user.id ?? user.sub;
    this.logger.log(`Permissions guard - User ID: ${userId}`);
    this.logger.log(`Permissions guard - Tenant ID: ${tenantId}`);

    if (!tenantId) {
      this.logger.warn('No tenant ID found in request');
      throw new ForbiddenException('Tenant ID required');
    }

    // if (!user.tenants || !user.tenants.includes(tenantId)) {
    //   this.logger.warn(`User ${userId} does not have access to tenant ${tenantId}`);
    //   throw new ForbiddenException('Access denied to this tenant');
    // }

    return this.userHasPermissions(userId, tenantId, requiredPermissions);
  }

  private async userHasPermissions(
    userId: string,
    tenantId: string,
    requiredPermissions: string[]
  ): Promise<boolean> {
    const permissions = await this.authService.getUserPermissionsForTenant(userId, tenantId);

    this.logger.debug(
      `User ${userId} has permissions in tenant ${tenantId}: ${permissions.join(', ')}`
    );

    const hasPermission = requiredPermissions.every((p) => permissions.includes(p));

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
