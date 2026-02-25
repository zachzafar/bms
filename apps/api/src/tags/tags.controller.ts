import { Controller, Headers, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { contract } from '@repo/api-contract';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { TagsService } from './tags.service';
import { TenantService } from 'src/tenant/tenant.service';
import * as schema from '@repo/api-contract';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller()
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly tenantService: TenantService,
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
    
    return { status: 201, body: { id: tag.id } };
  });
}

  @TsRestHandler(contract.settings.tags.getTags)
  async getTags(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.settings.tags.getTags, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const page = query.page ? Number(query.page) : 1;
      const pageSize = query.pageSize ? Number(query.pageSize) : 10;

      // Fetch only tags belonging to this tenant
      const tags = await this.tagsService.getTags(tenantId, page, pageSize);
      return { status: 200, body: tags };
    });
  }

  @TsRestHandler(contract.settings.tags.getTag)
  async getTag(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.settings.tags.getTag, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      const tag = await this.tagsService.getTag(params.id, true); // Get with signed URL

      // Validate tenant access
      await this.tenantService.validateTenantAccess(tenantId, schema.Tags, tag.id);

      return { status: 200, body: tag };
    });
  }

  @TsRestHandler(contract.settings.tags.deleteTag)
  async deleteTag(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.settings.tags.deleteTag, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      const tag = await this.tagsService.getTag((params.id));

      // Validate tenant access before deleting
      await this.tenantService.validateTenantAccess(tenantId, schema.Tags, tag.id);

      const result = await this.tagsService.deleteTag((params.id));
      return { status: 200, body: result };
    });
  }

  @TsRestHandler(contract.settings.tags.updateTag)
  async updateTag(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.settings.tags.updateTag, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      const tag = await this.tagsService.getTag(params.id);

      // Validate tenant access before updating
      await this.tenantService.validateTenantAccess(tenantId, schema.Tags, tag.id);

      const result = await this.tagsService.updateTag(params.id, body);
      return { status: 200, body: result };
    });
  }

  @UseInterceptors(FileInterceptor('image'))
  @TsRestHandler(contract.settings.tags.uploadTagImage)
  async uploadTagImage(
    @Headers() headers: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.settings.tags.uploadTagImage, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      const tag = await this.tagsService.getTag(params.id);

      // Validate tenant access before uploading
      await this.tenantService.validateTenantAccess(tenantId, schema.Tags, tag.id);

      if (!file) {
        return { status: 404, body: { message: 'No image provided' } };
      }

      const imagePath = await this.tagsService.uploadTagImage(tenantId, params.id, file.buffer);
      return { status: 200, body: { message: 'Image uploaded successfully', imagePath } };
    });
  }

  @TsRestHandler(contract.settings.tags.checkTagSlug)
  async checkTagSlug(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.settings.tags.checkTagSlug, async ({ query }) => {
      const available = await this.tagsService.checkTagSlug(query.slug, query.excludeId);
      return { status: 200, body: { available } };
    });
  }

  @Public()
  @TsRestHandler(contract.settings.tags.getTagsBySubdomain)
  async getTagsBySubdomain(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.settings.tags.getTagsBySubdomain, async ({ params, query }) => {
      try {
        const page = query.page ? Number(query.page) : 1;
        const pageSize = query.pageSize ? Number(query.pageSize) : 10;
        const tags = await this.tagsService.getTagsBySubdomain(params.subdomain, page, pageSize);
        return { status: 200, body: tags };
      } catch (error: any) {
        return { status: 404, body: { message: error.message || 'Tags not found' } };
      }
    });
  }
}
