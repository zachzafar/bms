import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { TenantService } from 'src/tenant/tenant.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { AuthModule } from 'src/auth/auth.module';
import { KeysModule } from 'src/keys/keys.module';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { BillingModule } from '../billing.module';

@Module({
  imports: [DrizzleModule, AuthModule, KeysModule, BillingModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, TenantService, PermissionsGuard],
  exports: [PaymentsService],
})
export class PaymentsModule {}