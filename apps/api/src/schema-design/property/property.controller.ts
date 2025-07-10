import { Controller, Logger, Headers } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract as c } from "@repo/api-contract"
import { PropertyService } from './property.service';
import { TenantService } from 'src/tenant/tenant.service';
import * as schema from '@repo/api-contract'

@Controller()
export class PropertyController {
  private readonly logger = new Logger(PropertyController.name);
    constructor(private PropertyService: PropertyService, private TenantService: TenantService) {}

    @TsRestHandler(c.settings.properties.createProperty)
    async getProperties(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
      return tsRestHandler(c.settings.properties.createProperty, async ({ body }) => {
        const tenantId = headers['x-tenant-id']
        this.logger.log(`Creating a new property for tenant:${tenantId}`);
        const propertyId = await this.PropertyService.createProperty({...body ,tenantId});
        return { status: 200, body: propertyId };
      }); 
    }
  
    @TsRestHandler(c.settings.properties.getProperties)
    async getPosts(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>>  {
      return tsRestHandler(c.settings.properties.getProperties, async () => {
        const tenantId = headers['x-tenant-id']
        const properties = await this.PropertyService.getProperties(tenantId);
  
        return { status: 200, body: properties};
      });
    }

    @TsRestHandler(c.settings.properties.getProperty)
    async getProperty(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>>  {
      return tsRestHandler(c.settings.properties.getProperty, async ({ params }) => {
        const tenantId = headers['x-tenant-id']
        await this.TenantService.validateTenantAccess(tenantId, schema.assetProperty, params.id)
        const property = await this.PropertyService.getProperty(params.id);

        if (!property) {
          return {
            status: 404 as const,
            body: { message: 'Property not found' as const }
          };
        }

        return {
          status: 200 as const,
          body: property
        };
      });
    }

    @TsRestHandler(c.settings.properties.updateProperty)
    async updateProperty(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>>  {
      return tsRestHandler(c.settings.properties.updateProperty, async ({ params, body }) => {
        const tenantId = headers['x-tenant-id']
        await this.TenantService.validateTenantAccess(tenantId, schema.assetProperty, params.id)
        const property = await this.PropertyService.updateProperty(params.id, body);
        if (!property) {
          return { status: 404, body: { message: 'Property not found' } };
        }
        return { status: 200, body: property};
      });
    }

    @TsRestHandler(c.settings.properties.deleteProperty)
    async deleteProperty(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>>  {
      return tsRestHandler(c.settings.properties.deleteProperty, async ({ params }) => {
        const property = await this.PropertyService.deleteProperty(Number(params.id));
        // if (!property) {
        //   return { status: 404, body: { message: 'Property not found' } };
        // }
        return { status: 200, body: { message: 'Property deleted'}};
      });
    }


}
