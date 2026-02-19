import { forwardRef, Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { MaintenanceModule } from 'src/maintenance/maintenance.module';
import { TenantService } from 'src/tenant/tenant.service';
import { RatesModule } from 'src/rates/rates.module';
import { AddonModule } from 'src/addon/addon.module';
import { TaxFeeModule } from 'src/tax-fee/tax-fee.module';

@Module({
  imports: [DrizzleModule, forwardRef(() => MaintenanceModule), RatesModule, AddonModule, TaxFeeModule],
  providers: [BookingService, TenantService],
  controllers: [BookingController],
  exports: [BookingService]
})
export class BookingModule {}
