import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { BookingModule } from 'src/booking/booking.module';


@Module({
  imports: [DrizzleModule, BookingModule],
  providers: [MaintenanceService],
  controllers: [MaintenanceController]
})
export class MaintenanceModule {}
