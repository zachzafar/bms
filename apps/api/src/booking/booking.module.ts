import { forwardRef, Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { MaintenanceModule } from 'src/maintenance/maintenance.module';
import { SlotService } from 'src/slot/slot.service';
import { TenantService } from 'src/tenant/tenant.service';
import { RatesModule } from 'src/rates/rates.module';

@Module({
  imports: [DrizzleModule, forwardRef(() => MaintenanceModule), RatesModule],
  providers: [BookingService, SlotService, TenantService],
  controllers: [BookingController],
  exports: [BookingService]
})
export class BookingModule {}
