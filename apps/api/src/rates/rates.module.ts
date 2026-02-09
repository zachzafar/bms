import { Module } from '@nestjs/common';
import { RatesController } from './rates.controller';
import { RatesService } from './rates.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { AuthModule } from 'src/auth/auth.module';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { KeysModule } from 'src/keys/keys.module';

@Module({
  imports: [DrizzleModule, AuthModule, KeysModule],
  providers: [RatesService, PermissionsGuard],
  controllers: [RatesController],
  exports: [RatesService],
})
export class RatesModule {}
