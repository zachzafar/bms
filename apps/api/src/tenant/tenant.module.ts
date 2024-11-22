import { Module } from '@nestjs/common';
import { TenantsService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  providers: [TenantsService],
  controllers: [TenantController]
})
export class TenantModule {}
