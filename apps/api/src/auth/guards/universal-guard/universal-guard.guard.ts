import { BadRequestException, CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';

@Injectable()
export class UniversalGuard extends AuthGuard(['jwt',"api-key"]) {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }
  
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]); 

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { url } = request;
    if (url.startsWith('/api-docs')) {
      return true; // Allow access to Swagger documentation
    }

    this.logger.log('Checking authentication');

    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    if (err) {
      this.logger.error('Error during JWT authentication', err);
      throw err;
    }
      if (info) {
        this.logger.warn(`JWT authentication info: ${info}`);
        if (info.name === 'TokenExpiredError') {
          throw new UnauthorizedException('JWT token has expired');
        } else {
          throw new UnauthorizedException('Invalid JWT token');
        }
      }
    if (!user) {
      throw new UnauthorizedException('No user found');
      this.logger.warn('No user found during JWT authentication');
    }

    this.logger.log('JWT authentication successful');
    return user;
  }
}
