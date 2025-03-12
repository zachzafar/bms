import { Module } from '@nestjs/common';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { TenantService } from 'src/tenant/tenant.service';

@Module({
  imports: [DrizzleModule, TenantModule],
  controllers: [FormsController],
  providers: [FormsService, TenantService]
})
export class FormsModule {}
