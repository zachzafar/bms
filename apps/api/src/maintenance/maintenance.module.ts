import { forwardRef, Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { BookingModule } from 'src/booking/booking.module';
import { TenantService } from 'src/tenant/tenant.service';
import { TenantModule } from 'src/tenant/tenant.module';


@Module({
  imports: [DrizzleModule,forwardRef(() => BookingModule),TenantModule ],
  providers: [MaintenanceService,TenantService],
  controllers: [MaintenanceController],
  exports: [MaintenanceService]
})
export class MaintenanceModule {}
