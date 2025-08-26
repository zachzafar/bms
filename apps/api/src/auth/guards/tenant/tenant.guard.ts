import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';
import { SKIP_TENANT_CHECK_KEY } from 'src/auth/decorators/skipTenantCheck.decorator';
import { TenantService } from 'src/tenant/tenant.service';
import { KeysService } from 'src/keys/keys.service';

@Injectable()
export class TenantGuard implements CanActivate {

  constructor(private reflector: Reflector,private tenantService: TenantService,private keyService: KeysService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];
    const apikey = request.headers['x-api-key'];
    const user = request.user;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    const skipTenantCheck = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_CHECK_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic || skipTenantCheck) {
      return true;
    }

    const { url } = request;
    if (url.startsWith('/api-docs')) {
      return true; // Allow access to Swagger documentation
    }

    // Check if user is an admin - admins can access any tenant
    if (user && this.isAdminUser(user)) {
      return true;
    }

    if (apikey) {
      return this.keyService.tenatHasKey(tenantId, apikey);
    }

    return this.tenantService.tenantHasUser(tenantId, request.user.sub);
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

    return false;
  }
}
