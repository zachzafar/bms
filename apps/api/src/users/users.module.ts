import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthController } from '../auth/auth.controller';
import { UsersController } from './users.controller';

@Module({
  providers: [UsersService],
  controllers: [AuthController, UsersController]
})
export class UsersModule {}
