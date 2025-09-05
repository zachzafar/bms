import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { AuthModule } from 'src/auth/auth.module';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [TeamsController],
  providers: [TeamsService, PermissionsGuard]
})
export class TeamsModule {}
