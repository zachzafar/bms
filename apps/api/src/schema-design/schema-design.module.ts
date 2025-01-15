import { Module } from '@nestjs/common';
import { PropertyModule } from './property/property.module';
import { ImportModule } from './import/import.module';
import { FormsModule } from './forms/forms.module';
import { AssetTypeModule } from './asset-type/asset-type.module';
import { GroupModule } from './group/group.module';

@Module({
  imports: [PropertyModule, ImportModule, FormsModule, AssetTypeModule, GroupModule]
})
export class SchemaDesignModule {}
