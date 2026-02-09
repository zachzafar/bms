import { Module } from '@nestjs/common';
import { OwnerController } from './owner.controller';
import { OwnerCrudController } from './owner-crud.controller';
import { OwnerService } from './owner.service';
import { BookingModule } from 'src/booking/booking.module';
import { MaintenanceModule } from 'src/maintenance/maintenance.module';
import { AssetsModule } from 'src/assets/assets.module';
import { OwnerGuard } from 'src/auth/guards/owner/owner.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { AuthModule } from 'src/auth/auth.module';
import { KeysModule } from 'src/keys/keys.module';

@Module({
  imports: [DrizzleModule, AuthModule, KeysModule, BookingModule, MaintenanceModule, AssetsModule],
  controllers: [OwnerController, OwnerCrudController],
  providers: [OwnerService, OwnerGuard, PermissionsGuard],
  exports: [OwnerService],
})
export class OwnerModule {}
