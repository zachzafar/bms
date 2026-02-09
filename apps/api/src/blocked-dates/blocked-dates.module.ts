import { Module } from '@nestjs/common';
import { BlockedDatesService } from './blocked-dates.service';
import { BlockedDatesController } from './blocked-dates.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  providers: [BlockedDatesService],
  controllers: [BlockedDatesController],
  exports: [BlockedDatesService]
})
export class BlockedDatesModule {}
