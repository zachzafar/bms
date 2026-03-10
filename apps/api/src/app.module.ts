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
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EmailModule } from './email/email.module';
import { RatesModule } from './rates/rates.module';
import { BlockedDatesModule } from './blocked-dates/blocked-dates.module';
import { TagsModule } from './tags/tags.module';
import { BillingModule } from './billing/billing.module';
import { SystemAdminModule } from './system-admin/system-admin.module';
import { InvoicesModule } from './billing/invoices/invoices.module';
import { PaymentsModule } from './billing/payments/payments.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { OwnerModule } from './owner/owner.module';
import { OwnerAuthModule } from './owner-auth/owner-auth.module';
import { CustomersModule } from './customers/customers.module';
import { AddonModule } from './addon/addon.module';
import { TaxFeeModule } from './tax-fee/tax-fee.module';
var cors = require('cors');

const allowAllCorsEndpoints = [
  '/api-docs-json',
  '/api-docs',
  'assets/details'
]

@Module({
  imports: [
    DrizzleModule,
    SchemaDesignModule,
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService globally available
      envFilePath: '.env', // Path to your environment file
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000, // Time window in milliseconds (60 seconds)
      limit: 100, // Maximum number of requests per ttl
    }]),
    AssetsModule,
    BookingModule,
    MaintenanceModule,
    TeamsModule,
    TenantModule,
    ObjectStorageModule,
    KeysModule,
    AnalyticsModule,
    EventEmitterModule.forRoot(),
    EmailModule,
    RatesModule,
    BlockedDatesModule,
    TagsModule,
    BillingModule,
    SystemAdminModule,
    InvoicesModule,
    PaymentsModule,
    OwnerModule,
    OwnerAuthModule,
    CustomersModule,
    AddonModule,
    TaxFeeModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ObjectStorageService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
       .apply(cors({
          origin: (requestOrigin: string, callback: (err: Error | null, origin?: boolean) => void) => {
             callback(null, true);
          }
       }))
       .forRoutes('*'); // use .forRoutes('(.*)') if fastify
 }

}
