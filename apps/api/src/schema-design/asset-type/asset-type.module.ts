import { Module } from '@nestjs/common';
import { AssetTypeService } from './asset-type.service';
import { AssetTypeController } from './asset-type.controller';

@Module({
  providers: [AssetTypeService],
  controllers: [AssetTypeController]
})
export class AssetTypeModule {}
