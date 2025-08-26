import { Inject, Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigType } from '@nestjs/config';
import type { AuthJwtPayload } from '../types/auth-jwtPayload';
import { AuthService } from '../auth.service';
import refreshConfig from '../config/refresh.config';
import { Request } from 'express';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor(
    @Inject(refreshConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshConfig>,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh'),
      secretOrKey: refreshTokenConfig.secret,
      ignoreExpiration: true,
      passReqToCallback: true,
    });
  }
 
  validate(req: Request, payload: AuthJwtPayload) {
    console.log('Validating refresh token',payload.sub,req.body.refresh);
    const userId = payload.sub;
    
    const refreshToken = req.body.refresh;

    // Validate the refresh token
    const isValid = this.authService.validateRefreshToken(userId, refreshToken);
    
    // Return the same structure as JWT strategy for consistency
    return {
      sub: userId,
      tenants: payload.tenants,
      roles: payload.roles
    };
  }
}