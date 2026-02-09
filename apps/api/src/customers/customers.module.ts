import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { AuthModule } from 'src/auth/auth.module';
import { KeysModule } from 'src/keys/keys.module';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';

@Module({
  imports: [DrizzleModule, AuthModule, KeysModule],
  providers: [CustomersService, PermissionsGuard],
  controllers: [CustomersController],
  exports: [CustomersService],
})
export class CustomersModule {}
