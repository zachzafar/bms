import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './drizzle/drizzle.module';
import { SchemaDesignModule } from './schema-design/schema-design.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AssetsModule } from './assets/assets.module';
import { BookingModule } from './booking/booking.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { TeamsModule } from './teams/teams.module';
import { TenantModule } from './tenant/tenant.module';
import { ObjectStorageService } from './object-storage/object-storage.service';
import { ObjectStorageModule } from './object-storage/object-storage.module';
import { KeysModule } from './keys/keys.module';

@Module({
  imports: [DrizzleModule, SchemaDesignModule, AuthModule, UsersModule,ConfigModule.forRoot({
    isGlobal: true, // Makes ConfigService globally available
    envFilePath: '.env', // Path to your environment file
  }), AssetsModule, BookingModule, MaintenanceModule, TeamsModule, TenantModule, ObjectStorageModule, KeysModule,],
  controllers: [AppController],
  providers: [AppService, ObjectStorageService],
})
export class AppModule {}
