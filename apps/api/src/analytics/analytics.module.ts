import { Module } from '@nestjs/common';
import { AssetsModule } from './assets/assets.module';
import { UsersModule } from './users/users.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [AssetsModule, UsersModule, BookingsModule]
})
export class AnalyticsModule {}
