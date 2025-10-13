import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { AssetTypeModule } from '../asset-type/asset-type.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { AssetsModule } from 'src/assets/assets.module';
import { AssetsService } from 'src/assets/assets.service';
import { TenantService } from 'src/tenant/tenant.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { ObjectStorageModule } from 'src/object-storage/object-storage.module';

@Module({
  providers: [ImportService,AssetsService,TenantService], 
  controllers: [ImportController],
  imports: [TenantModule,AssetTypeModule,AssetsModule,DrizzleModule,ObjectStorageModule],
})
export class ImportModule {}
