import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract as c } from "@repo/api-contract"
import { PropertyService } from './property.service';

@Controller('property')
export class PropertyController {
    constructor(private service: PropertyService) {}

    // @TsRestHandler(c.getProperties)
    // async getProperties(): Promise<{ status: number; body: any }> {
    //   return tsRestHandler(c.getProperties, async ({ params }) => {
    //     const post = await this.service.getProperties(params.id);
  
    //     if (!post) {
    //       return { status: 404, body: null };
    //     }
  
    //     return { status: 200, body: post };
    //   }); 
    // }
  
    // @TsRestHandler(c.getPosts)
    // async getPosts() {
    //   return tsRestHandler(c.getPosts, async () => {
    //     const posts = await this.service.getPosts();
  
    //     return { status: 200, body: posts };
    //   });
    // }
}
