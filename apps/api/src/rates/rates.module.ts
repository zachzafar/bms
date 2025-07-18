import { Module } from '@nestjs/common';
import { RatesController } from './rates.controller';
import { RatesService } from './rates.service';

@Module({
  providers: [RatesService],
  controllers: [RatesController]
})
export class RatesModule {}
