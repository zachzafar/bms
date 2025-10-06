import { forwardRef, Module } from '@nestjs/common';
import { SlotController } from './slot.controller';
import { SlotService } from './slot.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { MaintenanceModule } from 'src/maintenance/maintenance.module';
import { AuthModule } from 'src/auth/auth.module';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { KeysModule } from 'src/keys/keys.module';

@Module({
  imports: [DrizzleModule,forwardRef(() => MaintenanceModule), AuthModule, KeysModule],
  providers: [SlotService, PermissionsGuard],
  controllers: [SlotController],
  exports: [SlotService],
})
export class SlotModule {}
