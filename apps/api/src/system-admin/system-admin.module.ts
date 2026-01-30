import { Module } from '@nestjs/common';
import { SystemAdminController } from './system-admin.controller';
import { SystemAdminService } from './system-admin.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { SchemaDesignModule } from 'src/schema-design/schema-design.module';
import { TagsModule } from 'src/tags/tags.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [DrizzleModule, UsersModule,SchemaDesignModule,TagsModule,AuthModule],
  controllers: [SystemAdminController],
  providers: [SystemAdminService, UsersService],
  exports: [SystemAdminService],
})
export class SystemAdminModule {}
