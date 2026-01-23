// tags.module.ts
import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TenantService } from 'src/tenant/tenant.service';
import { ObjectStorageModule } from 'src/object-storage/object-storage.module';


@Module({
  imports: [
    DrizzleModule,
    ObjectStorageModule,
  ],
  controllers: [TagsController],
  providers: [TagsService, TenantService],
  exports: [TagsService],
})
export class TagsModule {}
