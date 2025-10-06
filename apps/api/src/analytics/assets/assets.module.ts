import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetAnalyticsService } from './assets.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { AuthModule } from 'src/auth/auth.module'; // <-- import AuthModule
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { KeysModule } from 'src/keys/keys.module';


@Module({
  imports: [DrizzleModule, AuthModule, TenantModule, KeysModule], // <-- make AuthService available
  controllers: [AssetsController],
  providers: [AssetAnalyticsService, PermissionsGuard]
})
export class AssetsModule {}
