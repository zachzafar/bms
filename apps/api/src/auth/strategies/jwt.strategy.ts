import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import jwtConfig from '../config/jwt.config';
import type { AuthJwtPayload } from '../types/auth-jwtPayload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  
  constructor(
    @Inject(jwtConfig.KEY)
    private jwtConfiguration: ConfigType<typeof jwtConfig>,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConfiguration.secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: AuthJwtPayload & { type?: string }) {
    this.logger.debug(`Validating JWT payload: ${JSON.stringify(payload)}`);

    // Reject owner tokens — they must only be used through the OwnerGuard
    if (payload.type === 'owner') {
      throw new UnauthorizedException('Owner tokens are not valid for this endpoint');
    }

    // Return the JWT payload directly instead of calling the database
    // This preserves the tenants and roles data needed by the permissions guard
    // The payload structure is: { sub: userId, tenants: string[], roles: Record<string, Array> }
    return {
      sub: payload.sub,
      tenants: payload.tenants,
      roles: payload.roles
    };
  }
}