import { Controller, Headers } from '@nestjs/common';
import { contract } from '@repo/api-contract';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { TagsService } from './tags.service';
import { TenantService } from 'src/tenant/tenant.service';
import * as schema from '@repo/api-contract';

@Controller()
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly tenantService: TenantService // ✅ now injected
  ) {}

  @TsRestHandler(contract.settings.tags.createTag)
async createTag(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
  return tsRestHandler(contract.settings.tags.createTag, async ({ body }) => {
    const tenantId = body.tenantId || headers['x-tenant-id'];

    if (!tenantId) {
      throw new Error('Tenant ID is missing from headers'); // Ensure tenantId exists
    }

    // Add tenantId to the request body before passing it to the service
    const tagData = { ...body, tenantId };

    // Call the service with the complete data
    const tag = await this.tagsService.createTag(tagData);
    
    return { status: 201, body: { id: String(tag.id) } };
  });
}

  @TsRestHandler(contract.settings.tags.getTags)
  async getTags(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.settings.tags.getTags, async () => {
      const tenantId = headers['x-tenant-id'];
      // Fetch only tags belonging to this tenant
      const tags = await this.tagsService.getTags(tenantId);
      return { status: 200, body: tags };
    });
  }

  @TsRestHandler(contract.settings.tags.getTag)
  async getTag(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.settings.tags.getTag, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      const tag = await this.tagsService.getTag(Number(params.id));

      // Validate tenant access
      await this.tenantService.validateTenantAccess(tenantId, schema.Tags, tag.id);

      return { status: 200, body: tag };
    });
  }

  @TsRestHandler(contract.settings.tags.deleteTag)
  async deleteTag(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.settings.tags.deleteTag, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      const tag = await this.tagsService.getTag(Number(params.id));

      // Validate tenant access before deleting
      await this.tenantService.validateTenantAccess(tenantId, schema.Tags, tag.id);

      const result = await this.tagsService.deleteTag(Number(params.id));
      return { status: 200, body: result };
    });
  }
}
