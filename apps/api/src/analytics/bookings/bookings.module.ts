import { Module } from '@nestjs/common';
import { BookingsAnalyticsController } from './bookings.controller';
import { BookingAnalyticsService } from './bookings.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [BookingsAnalyticsController],
  providers: [BookingAnalyticsService]
})
export class BookingsModule {}
