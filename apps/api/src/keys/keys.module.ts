import { Module } from '@nestjs/common';
import { KeysService } from './keys.service';
import { KeysController } from './keys.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TenantModule } from 'src/tenant/tenant.module';

@Module({
  imports: [DrizzleModule, TenantModule],
  providers: [KeysService],
  controllers: [KeysController],
  exports: [KeysService], // ✅ make it available to AuthModule
})
export class KeysModule {}
