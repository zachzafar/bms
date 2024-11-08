import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './drizzle/drizzle.module';
import { SchemaDesignModule } from './schema-design/schema-design.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RegisterModule } from './register/register.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [DrizzleModule, SchemaDesignModule, AuthModule, UsersModule, RegisterModule, TenantModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
