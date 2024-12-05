import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtGuardGuard extends AuthGuard('jwt') {

  constructor(private reflector: Reflector) {
    super();
  }
  
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]); 

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { url } = request;
    if (url.startsWith('/api-docs')) {
      return true; // Allow access to Swagger documentation
    }


    return super.canActivate(context);
  }
}
