import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { OwnerAuthService } from './owner-auth.service';
import { OwnerAuthController } from './owner-auth.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import jwtConfig from 'src/auth/config/jwt.config';

@Module({
  imports: [
    DrizzleModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
  ],
  providers: [OwnerAuthService],
  controllers: [OwnerAuthController],
  exports: [JwtModule],
})
export class OwnerAuthModule {}
