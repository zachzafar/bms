import { forwardRef, Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { BookingModule } from 'src/booking/booking.module';
import { TenantService } from 'src/tenant/tenant.service';
import { TenantModule } from 'src/tenant/tenant.module';
import { ObjectStorageService } from 'src/object-storage/object-storage.service';
import { AuthModule } from 'src/auth/auth.module';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';


@Module({
  imports: [DrizzleModule,forwardRef(() => BookingModule),TenantModule, AuthModule ],
  providers: [MaintenanceService,TenantService,ObjectStorageService, PermissionsGuard],
  controllers: [MaintenanceController],
  exports: [MaintenanceService]
})
export class MaintenanceModule {}
