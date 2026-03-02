import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger, Inject, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
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
    private readonly jwtService: JwtService,
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireOwner = this.reflector.getAllAndOverride<boolean>(
      OWNER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireOwner) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const authHeader: string | undefined = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing owner token');
    }

    const token = authHeader.slice(7);
    let payload: { sub: number; tenantId: string; type: string };

    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired owner token');
    }

    if (payload.type !== 'owner') {
      throw new ForbiddenException('This endpoint requires an owner token');
    }

    const ownerAssets = await this.db
      .select({ assetId: schema.OwnerHasAssets.assetId })
      .from(schema.OwnerHasAssets)
      .where(eq(schema.OwnerHasAssets.ownerId, payload.sub));

    request.user = { sub: payload.sub, tenantId: payload.tenantId };
    request.ownerAssets = ownerAssets.map((row) => row.assetId);

    this.logger.log(`Owner ${payload.sub} authenticated with ${request.ownerAssets.length} assets`);
    return true;
  }
}
