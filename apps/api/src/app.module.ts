import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './drizzle/drizzle.module';
import { SchemaDesignModule } from './schema-design/schema-design.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DrizzleModule, SchemaDesignModule, AuthModule, UsersModule,ConfigModule.forRoot({
    isGlobal: true, // Makes ConfigService globally available
    envFilePath: '.env', // Path to your environment file
  }),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
