import { Module } from '@nestjs/common';
import { drizzleProvider, DrizzleAsyncProvider } from './drizzle.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [...drizzleProvider],
  exports: [DrizzleAsyncProvider]
})
export class DrizzleModule {}