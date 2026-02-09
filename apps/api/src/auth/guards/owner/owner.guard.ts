import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { eq } from 'drizzle-orm';

export const OWNER_KEY = 'owner';

export const RequireOwner = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(OWNER_KEY, true, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class OwnerGuard implements CanActivate {
  private readonly logger = new Logger(OwnerGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireOwner = this.reflector.getAllAndOverride<boolean>(
      OWNER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireOwner) {
      return true; // No owner requirement
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    

    this.logger.log(`Owner ${user.sub} authenticated`);
    return true;
  }
}
