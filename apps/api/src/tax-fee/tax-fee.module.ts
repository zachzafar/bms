import { Module } from '@nestjs/common';
import { TaxFeeController } from './tax-fee.controller';
import { TaxFeeService } from './tax-fee.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { AuthModule } from 'src/auth/auth.module';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { KeysModule } from 'src/keys/keys.module';

@Module({
  imports: [DrizzleModule, AuthModule, KeysModule],
  providers: [TaxFeeService, PermissionsGuard],
  controllers: [TaxFeeController],
  exports: [TaxFeeService],
})
export class TaxFeeModule {}
