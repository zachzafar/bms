import { forwardRef, Module } from '@nestjs/common';
import { RatesController } from './rates.controller';
import { RatesService } from './rates.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TenantService } from 'src/tenant/tenant.service';

@Module({
  imports: [
    DrizzleModule,
  ],
  providers: [RatesService,TenantService],
  controllers: [RatesController],
  exports: [RatesService],
})
export class RatesModule {}
