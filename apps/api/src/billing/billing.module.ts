import { Module } from '@nestjs/common';

import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [],
  providers: [],
  exports: []
})
export class BillingModule {}
