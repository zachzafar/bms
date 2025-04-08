import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetAnalyticsService } from './assets.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TenantModule } from 'src/tenant/tenant.module';

@Module({
  imports: [DrizzleModule, TenantModule],
  controllers: [AssetsController],
  providers: [AssetAnalyticsService]
})
export class AssetsModule {}
