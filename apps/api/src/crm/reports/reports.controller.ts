import { Controller, Headers } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { reportsContract } from '@repo/api-contract';
import { ReportsService } from './reports.service';
import { TenantService } from 'src/tenant/tenant.service';

@Controller()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly tenantService: TenantService
  ) {}

  // @Roles([PermissionScope.CRM_READ])
  // @TsRestHandler(reportsContract.getContactsSummary)
  // async getContactsSummary(@Headers('x-tenant-id') tenantId: string): Promise<ReturnType<typeof tsRestHandler>> {
  //   return tsRestHandler(reportsContract.getContactsSummary, async ({ query }) => {
  //     const result = await this.reportsService.getContactsReport(tenantId, query);
  //     return { status: 200, body: result };
  //   });
  // }

  // // @Roles([PermissionScope.CRM_READ])
  // @TsRestHandler(reportsContract.getInquiriesByStatus)
  // async getInquiriesByStatus(@Headers('x-tenant-id') tenantId: string): Promise<ReturnType<typeof tsRestHandler>> {
  //   return tsRestHandler(reportsContract.getInquiriesByStatus, async ({ query }) => {
  //     const result = await this.reportsService.getInquiriesReport(tenantId, query);
  //     return { status: 200, body: result };
  //   });
  // }

  // // @Roles([PermissionScope.CRM_READ])
  // @TsRestHandler(reportsContract.getCommunicationTrends)
  // async getCommunicationTrends(@Headers('x-tenant-id') tenantId: string): Promise<ReturnType<typeof tsRestHandler>> {
  //   return tsRestHandler(reportsContract.getCommunicationTrends, async ({ query }) => {
  //     const result = await this.reportsService.getCommunicationsReport(tenantId, query);
  //     return { status: 200, body: result };
  //   });
  // }

  // // @Roles([PermissionScope.CRM_READ])
  // @TsRestHandler(reportsContract.getFeedbackRatings)
  // async getFeedbackRatings(@Headers('x-tenant-id') tenantId: string): Promise<ReturnType<typeof tsRestHandler>> {
  //   return tsRestHandler(reportsContract.getFeedbackRatings, async ({ query }) => {
  //     const result = await this.reportsService.getFeedbackReport(tenantId, query);
  //     return { status: 200, body: result };
  //   });
  // }

  // // @Roles([PermissionScope.CRM_READ])
  // @TsRestHandler(reportsContract.getTaskCompletion)
  // async getTaskCompletion(@Headers('x-tenant-id') tenantId: string): Promise<ReturnType<typeof tsRestHandler>> {
  //   return tsRestHandler(reportsContract.getTaskCompletion, async ({ query }) => {
  //     const result = await this.reportsService.getTasksReport(tenantId, query);
  //     return { status: 200, body: result };
  //   });
  // }

  // @Roles([PermissionScope.CRM_READ])
  @TsRestHandler(reportsContract.getOverallDashboard)
  async getOverallDashboard(@Headers('x-tenant-id') tenantId: string): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(reportsContract.getOverallDashboard, async ({ query }) => {
      const result = await this.reportsService.getOverview(tenantId, query);
      return { status: 200, body: result as any};
    });
  }
}