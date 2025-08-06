// tags.module.ts
import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module'; // Adjust path as needed

@Module({
  imports: [DrizzleModule], // <-- 🔥 This makes DrizzleAsyncProvider available
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}
