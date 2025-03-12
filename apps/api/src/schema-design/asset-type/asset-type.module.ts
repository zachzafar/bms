import { Module } from '@nestjs/common';
import { AssetTypeService } from './asset-type.service';
import { AssetTypeController } from './asset-type.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { TenantService } from 'src/tenant/tenant.service';

@Module({
  imports: [DrizzleModule,TenantModule],
  providers: [AssetTypeService,TenantService],
  controllers: [AssetTypeController]
})
export class AssetTypeModule {}
