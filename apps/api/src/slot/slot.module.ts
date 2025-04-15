import { forwardRef, Module } from '@nestjs/common';
import { SlotController } from './slot.controller';
import { SlotService } from './slot.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { MaintenanceModule } from 'src/maintenance/maintenance.module';

@Module({
  imports: [DrizzleModule,forwardRef(() => MaintenanceModule)],
  providers: [SlotService],
  controllers: [SlotController],
  exports: [SlotService],
})
export class SlotModule {}
