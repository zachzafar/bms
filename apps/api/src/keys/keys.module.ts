import { Module } from '@nestjs/common';
import { KeysService } from './keys.service';
import { KeysController } from './keys.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { AuthModule } from 'src/auth/auth.module'; // <-- import AuthModule
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';


@Module({
  imports: [DrizzleModule,TenantModule, AuthModule], // <-- make AuthService available
  providers: [KeysService, PermissionsGuard],
  controllers: [KeysController]
})
export class KeysModule {}
