import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import refreshConfig from './config/refresh.config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshStrategy } from './strategies/refresh-token.strategy';
import { UsersService } from 'src/users/users.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { PassportModule } from '@nestjs/passport';
import { Tenant } from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { TenantGuard } from './guards/tenant/tenant.guard';
import { ApiKeyStrategy } from './strategies/apikey.strategy';
import { KeysService } from 'src/keys/keys.service';
import { PasswordRestService } from './password-rest/password-rest.service';
import { AdminGuard } from './guards/admin/admin.guard';

@Module({
  imports: [
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshConfig),
    DrizzleModule,
  ],
  providers: [
      AuthService,
      UsersService,
      LocalStrategy,
      JwtStrategy,
      ApiKeyStrategy,
      RefreshStrategy,
      KeysService,
      TenantGuard,
      TenantService,
      PasswordRestService,
      AdminGuard
  ],
  exports:[AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
