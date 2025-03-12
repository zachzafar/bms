import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { TenantService } from 'src/tenant/tenant.service';

@Module({
  imports: [DrizzleModule,TenantModule],
  providers: [PropertyService,TenantService],
  controllers: [PropertyController]
})
export class PropertyModule {}
