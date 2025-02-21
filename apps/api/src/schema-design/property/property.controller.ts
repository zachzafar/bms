import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract as c } from "@repo/api-contract"
import { PropertyService } from './property.service';

@Controller('property')
export class PropertyController {
    constructor(private PropertyService: PropertyService) {}

    @TsRestHandler(c.settings.properties.createProperty)
    async getProperties(): Promise<ReturnType<typeof tsRestHandler>> {
      return tsRestHandler(c.settings.properties.createProperty, async ({ body }) => {
        const propertyId = await this.PropertyService.createProperty(body);
        return { status: 200, body: propertyId };
      }); 
    }
  
    @TsRestHandler(c.settings.properties.getProperties)
    async getPosts(): Promise<ReturnType<typeof tsRestHandler>>  {
      return tsRestHandler(c.settings.properties.getProperties, async () => {
        const properties = await this.PropertyService.getProperties();
  
        return { status: 200, body: properties};
      });
    }

    @TsRestHandler(c.settings.properties.getProperty)
    async getProperty(): Promise<ReturnType<typeof tsRestHandler>>  {
      return tsRestHandler(c.settings.properties.getProperty, async ({ params }) => {
        const property = await this.PropertyService.getProperty(params.id);

        if (!property) {
          return { status: 404, body: { message: 'Property not found' } };
        }

        return { status: 200, body: property};
      });
    }

    @TsRestHandler(c.settings.properties.updateProperty)
    async updateProperty(): Promise<ReturnType<typeof tsRestHandler>>  {
      return tsRestHandler(c.settings.properties.updateProperty, async ({ params, body }) => {
        const property = await this.PropertyService.updateProperty(params.id, body);
        if (!property) {
          return { status: 404, body: { message: 'Property not found' } };
        }
        return { status: 200, body: property};
      });
    }

    @TsRestHandler(c.settings.properties.deleteProperty)
    async deleteProperty(): Promise<ReturnType<typeof tsRestHandler>>  {
      return tsRestHandler(c.settings.properties.deleteProperty, async ({ params }) => {
        const property = await this.PropertyService.deleteProperty(params.id);
        if (!property) {
          return { status: 404, body: { message: 'Property not found' } };
        }
        return { status: 200, body: { message: 'Property deleted'}};
      });
    }


}
