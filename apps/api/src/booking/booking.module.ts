import { forwardRef, Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { MaintenanceModule } from 'src/maintenance/maintenance.module';
import { SlotService } from 'src/slot/slot.service';

@Module({
  imports: [DrizzleModule,forwardRef(() => MaintenanceModule)],
  providers: [BookingService,SlotService],
  controllers: [BookingController],
  exports: [BookingService]
})
export class BookingModule {}
