// tags.module.ts
import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module'; // Adjust path as needed
import { TenantService } from 'src/tenant/tenant.service';


@Module({
  imports: [
    DrizzleModule,
  ],
  controllers: [TagsController],
  providers: [TagsService,TenantService],
})
export class TagsModule {}
