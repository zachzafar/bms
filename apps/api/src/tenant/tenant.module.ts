import { Module } from '@nestjs/common';
import { TenantsService } from './tenant.service';
import { TenantController } from './tenant.controller';

@Module({
  providers: [TenantsService],
  controllers: [TenantController]
})
export class TenantModule {}
