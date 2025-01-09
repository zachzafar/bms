import { forwardRef, Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { BookingModule } from 'src/booking/booking.module';


@Module({
  imports: [DrizzleModule,forwardRef(() => BookingModule) ],
  providers: [MaintenanceService],
  controllers: [MaintenanceController],
  exports: [MaintenanceService]
})
export class MaintenanceModule {}
