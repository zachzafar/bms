import { Module } from '@nestjs/common';

import { DrizzleModule } from '../drizzle/drizzle.module';
import { ObjectStorageModule } from '../object-storage/object-storage.module';
import { PdfService } from './pdf/pdf.service';

@Module({
  imports: [DrizzleModule, ObjectStorageModule],
  controllers: [],
  providers: [PdfService],
  exports: [PdfService]
})
export class BillingModule {}
