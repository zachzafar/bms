import { Module } from '@nestjs/common';
import { AddonController } from './addon.controller';
import { AddonService } from './addon.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { AuthModule } from 'src/auth/auth.module';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { KeysModule } from 'src/keys/keys.module';

@Module({
  imports: [DrizzleModule, AuthModule, KeysModule],
  providers: [AddonService, PermissionsGuard],
  controllers: [AddonController],
  exports: [AddonService],
})
export class AddonModule {}
