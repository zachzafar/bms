import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';
import { SKIP_TENANT_CHECK_KEY } from 'src/auth/decorators/skipTenantCheck.decorator';
import { IS_AMDIN_ROUTE } from 'src/auth/decorators/admin.decorator';
import { TenantService } from 'src/tenant/tenant.service';
import { KeysService } from 'src/keys/keys.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class TenantGuard implements CanActivate {

  private readonly logger = new Logger(TenantGuard.name);

  constructor(private reflector: Reflector,private tenantService: TenantService,private keyService: KeysService, private userService: UsersService) {}

 canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];
    const apikey = request.headers['x-api-key'];
    const user = request.user;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    const skipTenantCheck = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_CHECK_KEY, [context.getHandler(), context.getClass()]);
    const isAdminRoute = this.reflector.getAllAndOverride<boolean>(IS_AMDIN_ROUTE, [context.getHandler(), context.getClass()]);
    if (isPublic || skipTenantCheck || isAdminRoute) {
      return true;
    }

    const { url } = request;
    if (url.startsWith('/api-docs')) {
      return true; // Allow access to Swagger documentation
    }


    if (apikey) {
      return this.keyService.tenatHasKey(tenantId, apikey);
    }

    return this.tenantService.tenantHasUser(tenantId, request.user.sub);
  }

  

  private async isAdminUser(userId: string): Promise<boolean> {
    return await this.userService.isAdminUser(userId);
  }
}
