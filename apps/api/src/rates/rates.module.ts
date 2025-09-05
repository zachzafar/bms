import { forwardRef, Module } from '@nestjs/common';
import { RatesController } from './rates.controller';
import { RatesService } from './rates.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TenantService } from 'src/tenant/tenant.service';
import { AuthModule } from 'src/auth/auth.module';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';

@Module({
  imports: [
    DrizzleModule,AuthModule
  ],
  providers: [RatesService,TenantService,PermissionsGuard],
  controllers: [RatesController],
  exports: [RatesService],
})
export class RatesModule {}
