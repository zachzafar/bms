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

    this.logger.log('Owner guard - User:', user);

    if (!user) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user exists and is an owner
    const dbUser = await this.db.query.User.findFirst({
      where: eq(schema.User.id, user.sub),
    });

    if (!dbUser) {
      this.logger.warn(`User ${user.sub} not found in database`);
      throw new ForbiddenException('User not found');
    }

    if (dbUser.userType !== 'owner') {
      this.logger.warn(`User ${user.sub} is not an owner (userType: ${dbUser.userType})`);
      throw new ForbiddenException('Owner access required');
    }

    // Get owner details
    const ownerDetails = await this.db.query.Owner.findFirst({
      where: eq(schema.Owner.userId, user.sub),
    });

    if (!ownerDetails) {
      this.logger.warn(`Owner details not found for user ${user.sub}`);
      throw new ForbiddenException('Owner profile not found');
    }

    // Get owner's assets
    const ownerAssets = await this.db.query.UserHasAssets.findMany({
      where: eq(schema.UserHasAssets.userId, user.sub),
    });

    // Attach owner data to request for use in controllers
    request.ownerDetails = ownerDetails;
    request.ownerAssets = ownerAssets.map(ua => ua.assetId);

    this.logger.log(`Owner ${user.sub} authenticated with ${ownerAssets.length} assets`);
    return true;
  }
}
