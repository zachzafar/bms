import { Module } from '@nestjs/common';
import { BookingsAnalyticsController } from './bookings.controller';
import { BookingAnalyticsService } from './bookings.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { AuthModule } from 'src/auth/auth.module'; // <-- import AuthModule
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';


@Module({
  imports: [DrizzleModule, AuthModule], // <-- make AuthService available
  controllers: [BookingsAnalyticsController],
  providers: [BookingAnalyticsService,PermissionsGuard]
})
export class BookingsModule {}
