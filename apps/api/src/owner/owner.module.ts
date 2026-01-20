import { Module } from '@nestjs/common';
import { OwnerController } from './owner.controller';
import { BookingModule } from 'src/booking/booking.module';
import { MaintenanceModule } from 'src/maintenance/maintenance.module';
import { AssetsModule } from 'src/assets/assets.module';
import { OwnerGuard } from 'src/auth/guards/owner/owner.guard';
import { DrizzleModule } from 'src/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule, BookingModule, MaintenanceModule, AssetsModule],
  controllers: [OwnerController],
  providers: [OwnerGuard],
})
export class OwnerModule {}
