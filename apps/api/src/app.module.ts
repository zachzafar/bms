import { MiddlewareConsumer, Module, RequestMethod,} from '@nestjs/common';
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
import { AnalyticsModule } from './analytics/analytics.module';
import { SlotService } from './slot/slot.service';
import { SlotController } from './slot/slot.controller';
import { SlotModule } from './slot/slot.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EmailModule } from './email/email.module';
import { RatesModule } from './rates/rates.module';
import { TagsModule } from './tags/tags.module';
import { BillingModule } from './billing/billing.module';
import { CrmModule } from './crm/crm.module';
import { SystemAdminModule } from './system-admin/system-admin.module';
var cors = require('cors');

const allowAllCorsEndpoints = [
  '/api-docs-json',
  '/api-docs',
  'assets/details'
]

@Module({
  imports: [DrizzleModule, SchemaDesignModule, AuthModule, UsersModule,ConfigModule.forRoot({
    isGlobal: true, // Makes ConfigService globally available
    envFilePath: '.env', // Path to your environment file
  }), AssetsModule, BookingModule, MaintenanceModule, TeamsModule, TenantModule, ObjectStorageModule, KeysModule, AnalyticsModule, SlotModule, EventEmitterModule.forRoot(), EmailModule, RatesModule, TagsModule, BillingModule, CrmModule, SystemAdminModule,],
  controllers: [AppController, SlotController],
  providers: [AppService, ObjectStorageService, SlotService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    console.log('yes executed app confogure')
    consumer
       .apply(cors({
          origin: (requestOrigin: string, callback: (err: Error | null, origin?: boolean) => void) => {
             console.log("Exec check");
             callback(null, true);
          }
       }))
       
       .forRoutes('*'); // use .forRoutes('(.*)') if fastify
 }

}
