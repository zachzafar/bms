import { Controller, Headers } from '@nestjs/common';
import { contract } from '@repo/api-contract';
import { tsRestHandler, TsRestHandler, TsRestRequest, } from '@ts-rest/nest';
import { TagsService } from './tags.service';

// const c = tagsContract;

@Controller()
export class TagsController {
  constructor(private readonly tagsService: TagsService) {

  }


  @TsRestHandler(contract.settings.tags.createTag)
  async createTag(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.settings.tags.createTag, async ({ body }) => {
      const tag = await this.tagsService.createTag(body);
      return { status: 201, body: { id: String(tag.id) } };
    });
  }


  @TsRestHandler(contract.settings.tags.getTags)
  async getTags(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.settings.tags.getTags, async () => {
      const tags = await this.tagsService.getTags();
      return { status: 200, body: tags };
    });
  }

  @TsRestHandler(contract.settings.tags.getTag)
  async getTag(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.settings.tags.getTag, async ({ params }) => {
      try {
        const tag = await this.tagsService.getTag(Number(params.id));
        return { status: 200, body: tag };
      } catch {
        return { status: 404, body: { message: 'Tag not found' } };
      }
    });
  }

  @TsRestHandler(contract.settings.tags.deleteTag)
  async deleteTag(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.settings.tags.deleteTag, async ({ params }) => {
      try {
        const result = await this.tagsService.deleteTag(Number(params.id));
        return { status: 200, body: result };
      } catch {
        return { status: 404, body: { message: 'Tag not found' } };
      }
    });
  }
}
