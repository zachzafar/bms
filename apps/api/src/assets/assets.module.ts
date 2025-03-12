import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { TenantService } from 'src/tenant/tenant.service';

@Module({
  imports: [DrizzleModule,TenantModule],
  controllers: [AssetsController],
  providers: [AssetsService,TenantService]
})
export class AssetsModule {}
