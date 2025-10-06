import { Module } from '@nestjs/common';
import { ContactsController } from './contacts/contacts.controller';
import { ContactsService } from './contacts/contacts.service';
import { InquiriesService } from './inquiries/inquiries.service';
import { DocumentsService } from './documents/documents.service';
import { DocumentsController } from './documents/documents.controller';
import { BrochuresController } from './brochures/brochures.controller';
import { BrochuresService } from './brochures/brochures.service';
import { FeedbackService } from './feedback/feedback.service';
import { FeedbackController } from './feedback/feedback.controller';
import { CommunicationsController} from './comunications/comunications.controller';
import { CommunicationsService } from './comunications/comunications.service';
import { InquiriesController } from './inquiries/inquiries.controller';
import { TasksController } from './task/task.controller';
import { TasksService } from './task/task.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { TenantService } from 'src/tenant/tenant.service';
import { ReportsService } from './reports/reports.service';
import { ReportsController } from './reports/reports.controller';


@Module({
  imports: [DrizzleModule, TenantModule],
  controllers: [ContactsController, InquiriesController, CommunicationsController, FeedbackController, BrochuresController, DocumentsController, TasksController, ReportsController],
  providers: [ContactsService, InquiriesService, CommunicationsService, FeedbackService, BrochuresService, DocumentsService, TasksService,TenantService, ReportsService]
})
export class CrmModule {}
