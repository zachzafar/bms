import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { eq, and, isNull } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { OwnerMagicLinkEvent } from './events';

@Injectable()
export class OwnerAuthService {
  private readonly logger = new Logger(OwnerAuthService.name);

  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async requestMagicLink(email: string, tenantId: string): Promise<boolean> {
    try {
      const owner = await this.db.query.Owner.findFirst({
        where: (o, { eq, and, isNull }) =>
          and(eq(o.email, email), eq(o.tenantId, tenantId), isNull(o.deletedAt)),
      });

      if (!owner) {
        // Return true to avoid email enumeration
        return true;
      }

      const token = `mk_${randomBytes(32).toString('hex')}`;
      const expiresAt = new Date(Date.now() + 24 * 3600000); // 24 hours

      await this.db.insert(schema.OwnerMagicLink).values({
        ownerId: owner.id,
        token,
        expiresAt,
      });

      const tenant = await this.db.query.Tenant.findFirst({
        where: (t, { eq }) => eq(t.id, owner.tenantId),
        columns: { subdomain: true },
      });

      this.eventEmitter.emit('owner.magic-link', {
        email: owner.email,
        ownerId: owner.id,
        token,
        expiresAt,
        subdomain: tenant?.subdomain ?? '',
      } satisfies OwnerMagicLinkEvent);
    } catch (error) {
      this.logger.error(`Error creating magic link: ${error}`);
    }

    return true;
  }

  async verifyMagicLink(token: string): Promise<{ accessToken: string; owner: { id: number; name: string; email: string } }> {
    const row = await this.db.query.OwnerMagicLink.findFirst({
      where: (ml, { eq }) => eq(ml.token, token),
    });

    if (!row) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    if (row.expiresAt < new Date()) {
      throw new UnauthorizedException('Magic link has expired');
    }

    if (row.usedAt) {
      throw new UnauthorizedException('Magic link has already been used');
    }

    await this.db
      .update(schema.OwnerMagicLink)
      .set({ usedAt: new Date() })
      .where(eq(schema.OwnerMagicLink.id, row.id));

    const owner = await this.db.query.Owner.findFirst({
      where: (o, { eq }) => eq(o.id, row.ownerId),
    });

    if (!owner) {
      throw new UnauthorizedException('Owner not found');
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: owner.id, tenantId: owner.tenantId, type: 'owner' },
      { expiresIn: '1h' },
    );

    return {
      accessToken,
      owner: { id: owner.id, name: owner.name, email: owner.email },
    };
  }

  @OnEvent('owner.magic-link')
  handleMagicLinkEmail(payload: OwnerMagicLinkEvent) {
    this.logger.log(`Sending magic link email to ${payload.email} for owner ${payload.ownerId}`);
    this.eventEmitter.emit('send-email', {
      email: payload.email,
      subject: 'Your BookOS login link',
      content: `
        <h1>Log in to BookOS</h1>
        <p>Click <a href="${process.env.FRONTEND_URL}/owner/${payload.subdomain}/login?token=${payload.token}">here</a> to log in to your owner portal.</p>
        <p>This link expires in 24 hours and can only be used once.</p>
        <p>If you did not request this link, you can safely ignore this email.</p>
      `,
    });
  }
}
