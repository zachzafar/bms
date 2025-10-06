import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { TenantService } from 'src/tenant/tenant.service';
import { ObjectStorageService } from 'src/object-storage/object-storage.service';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { AuthModule } from 'src/auth/auth.module';
import { KeysModule } from 'src/keys/keys.module';

@Module({
  imports: [DrizzleModule,TenantModule,AuthModule, KeysModule],
  controllers: [AssetsController],
  providers: [AssetsService,TenantService,ObjectStorageService,PermissionsGuard]
})
export class AssetsModule {}
