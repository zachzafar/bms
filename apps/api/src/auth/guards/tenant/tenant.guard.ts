import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';
import { SKIP_TENANT_CHECK_KEY } from 'src/auth/decorators/skipTenantCheck.decorator';
import { TenantService } from 'src/tenant/tenant.service';

@Injectable()
export class TenantGuard implements CanActivate {

  constructor(private reflector: Reflector,private tenantService: TenantService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    const skipTenantCheck = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_CHECK_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic || skipTenantCheck) {
      return true;
    }

    const { url } = request;
    if (url.startsWith('/api-docs')) {
      return true; // Allow access to Swagger documentation
    }
    
      return this.tenantService.tenantHasUser(tenantId,request.user.id)
    
  
  }
}
