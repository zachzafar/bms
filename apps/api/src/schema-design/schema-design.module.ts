import { Module } from '@nestjs/common';
import { PropertyModule } from './property/property.module';
import { ImportModule } from './import/import.module';
import { FormsModule } from './forms/forms.module';

@Module({
  imports: [PropertyModule, ImportModule, FormsModule]
})
export class SchemaDesignModule {}
