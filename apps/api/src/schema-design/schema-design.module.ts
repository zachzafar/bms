import { Module } from '@nestjs/common';
import { PropertyModule } from './property/property.module';
import { ImportModule } from './import/import.module';

@Module({
  imports: [PropertyModule, ImportModule]
})
export class SchemaDesignModule {}
