import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { AuthModule } from 'src/auth/auth.module'; // <-- import AuthModule
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { KeysModule } from 'src/keys/keys.module';


@Module({
  imports: [DrizzleModule, AuthModule, KeysModule], // <-- make AuthService available
  providers: [UsersService, PermissionsGuard],
  controllers: [UsersController],
})
export class UsersModule {}
