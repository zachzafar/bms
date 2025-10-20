// invoices.module.ts
import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { TenantService } from 'src/tenant/tenant.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { AuthModule } from 'src/auth/auth.module';
import { KeysModule } from 'src/keys/keys.module';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { SlotService } from 'src/slot/slot.service';

@Module({
    imports: [
        DrizzleModule, AuthModule, KeysModule
    ],
    controllers: [InvoicesController],
    providers: [InvoicesService, TenantService,SlotService, PermissionsGuard],
    exports: [InvoicesService]
})
export class InvoicesModule { }
