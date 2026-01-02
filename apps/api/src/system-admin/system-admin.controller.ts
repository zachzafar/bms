import { Controller, Logger } from '@nestjs/common';
import { SystemAdminService } from './system-admin.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin/admin.guard';
import { getAllScopes } from 'src/auth/permissions';
import { IsAdminRoute } from 'src/auth/decorators/admin.decorator';
import { UsersService } from 'src/users/users.service';
import { AssetTypeService } from 'src/schema-design/asset-type/asset-type.service';
import { PropertyService } from 'src/schema-design/property/property.service';
import { TagsService } from 'src/tags/tags.service';



@IsAdminRoute()
@UseGuards(AdminGuard)
@Controller()
export class SystemAdminController {
  private readonly logger = new Logger(SystemAdminController.name);

  constructor(
    private systemAdminService: SystemAdminService,
    private usersService: UsersService,
    private assetTypeService: AssetTypeService,
    private PropertyService: PropertyService,
    private tagsService: TagsService,
  ) { }

  // System Admin User Management
  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.createSystemAdmin)
  async createSystemAdmin(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.createSystemAdmin, async ({ body }) => {
      const result = await this.systemAdminService.createSystemAdmin(
        body.name,
        body.email,
        body.password
      );
      return { status: 201, body: result };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getSystemAdmins)
  async getSystemAdmins(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getSystemAdmins, async () => {
      const admins = await this.systemAdminService.getSystemAdmins();
      return { status: 200, body: admins };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.createUserForTenant)
  async createUserForTenant(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.createUserForTenant, async ({ body, params }) => {

      const result = await this.usersService.createUser({
        email: body.email,
        name: body.name,
        password: body.password,
        userType: 'system'
      },
        params.tenantId,
        body.roleIds
      );
      return { status: 201, body: { message: `Successfully added user to tenant ${params.tenantId}`, userId: result } };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.createTenant)
  async createTenant(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.createTenant, async ({ body }) => {
      const result = await this.systemAdminService.createTenant(body.tenant, body.adminUser);
      return { status: 201, body: result };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getTenants)
  async getTenants(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getTenants, async () => {
      const tenants = await this.systemAdminService.getTenants();
      return { status: 200, body: tenants };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getTenant)
  async getTenant(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getTenant, async ({ params }) => {
      const result = await this.systemAdminService.getTenant(params.id);
      return { status: 200, body: result };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.updateTenant)
  async updateTenant(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.updateTenant, async ({ params, body }) => {
      const result = await this.systemAdminService.updateTenant(
        params.id,
        body.tenant
      );
      return { status: 200, body: result };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.deleteTenant)
  async deleteTenant(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.deleteTenant, async ({ params }) => {
      const result = await this.systemAdminService.deleteTenant(params.id);
      return { status: 204, body: result };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getTenantDetails)
  async getTenantDetails(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getTenantDetails, async ({ params }) => {
      const result = await this.systemAdminService.getTenant(params.id);
      return { status: 200, body: result };
    });
  }

  // Role Management
  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.createTenantRole)
  async createTenantRole(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.createTenantRole, async ({ params, body }) => {
      const result = await this.systemAdminService.createTenantRole(
        params.tenantId,
        body.name,
        body.description,
        body.permissions
      );
      return { status: 201, body: result };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.updateTenantRole)
  async updateTenantRole(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.updateTenantRole, async ({ params, body }) => {
      const result = await this.systemAdminService.updateTenantRole(
        params.tenantId,
        params.roleId,
        body.name,
        body.description,
        body.permissions
      );
      return { status: 200, body: result };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.deleteTenantRole)
  async deleteTenantRole(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.deleteTenantRole, async ({ params }) => {
      const result = await this.systemAdminService.deleteTenantRole(
        params.tenantId,
        params.roleId
      );
      return { status: 204, body: result };
    });
  }


  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getTenantRoles)
  async getTenantRoles(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getTenantRoles, async ({ params }) => {
      const result = await this.systemAdminService.getTenantRoles(params.tenantId);
      return { status: 200, body: result };
    });
  }

  // User Assignment to Tenants
  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.assignUserToTenant)
  async assignUserToTenant(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.assignUserToTenant, async ({ params, body }) => {
      const result = await this.systemAdminService.assignUserToTenant(
        params.tenantId,
        body.userId,
        body.roleIds,
        body.isAdmin
      );
      return { status: 201, body: result };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getPermissions)
  async getPermissions(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.auth.getPermissions, async () => {
      const permissions = getAllScopes();

      return { status: 200, body: permissions };
    })
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.removeUserFromTenant)
  async removeUserFromTenant(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.removeUserFromTenant, async ({ params }) => {
      const result = await this.systemAdminService.removeUserFromTenant(
        params.tenantId,
        params.userId
      );
      return { status: 204, body: result };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getTenantUsers)
  async getTenantUsers(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getTenantUsers, async ({ params }) => {
      const result = await this.systemAdminService.getTenantUsers(params.tenantId);
      return { status: 200, body: result };
    });
  }



  // API Key Management
  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.createTenantApiKey)
  async createTenantApiKey(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.createTenantApiKey, async ({ params, body }) => {
      const result = await this.systemAdminService.createTenantApiKey(
        params.tenantId,
        body.name,
        body.scopes
      );
      return { status: 201, body: result };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getTenantApiKeys)
  async getTenantApiKeys(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getTenantApiKeys, async ({ params }) => {
      const result = await this.systemAdminService.getTenantApiKeys(params.tenantId);
      return { status: 200, body: result };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.deleteTenantApiKey)
  async deleteTenantApiKey(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.deleteTenantApiKey, async ({ params }) => {
      const result = await this.systemAdminService.deleteTenantApiKey(
        params.tenantId,
        params.keyId
      );
      return { status: 204, body: result };
    });
  }

  // System-wide operations
  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getSystemStats)
  async getSystemStats(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getSystemStats, async () => {
      const result = await this.systemAdminService.getSystemStats();
      return { status: 200, body: result };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getSystemLogs)
  async getSystemLogs(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getSystemLogs, async ({ query }) => {
      const result = await this.systemAdminService.getSystemLogs(
        query.level,
        query.startDate,
        query.endDate,
        query.limit,
        query.offset
      );
      return { status: 200, body: result };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.updateUserRoles)
  async updateUserRoles(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.updateUserRoles, async ({ params, body }) => {
      const result = await this.usersService.update(
        params.userId,
        params.tenantId,
        {},
        body.roleIds,
      );
      return { status: 204, body: { message: 'User roles updated successfully' } };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getAssetTypes)
  async getAssetTypes(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getAssetTypes, async ({ params }) => {

      const assetTypes = await this.assetTypeService.getAssetTypes(params.tenantId);
      return { status: 200, body: assetTypes };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.createAssetType)
  async createAssetType(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.createAssetType, async ({ body }) => {

      const id = await this.assetTypeService.createAssetType({ ...body.assetType }, body.properties);
      this.logger.log(`Created asset type with id ${id}`);
      return { status: 201, body: { id } };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getAssetType)
  async getAssetType(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getAssetType, async ({ params }) => {
      console.log(`Asset type id: ${params.id}`);
      const assetType = await this.assetTypeService.getAssetType((params.id));
      console.log(`Asset type: ${assetType}`);
      if (!assetType) {
        return {
          status: 404 as const,
          body: { message: 'Asset type not found' }
        };
      }
      console.log(assetType);
      const { properties, ...assetTypeData } = assetType;
      return {
        status: 200 as const,
        body: { assetType: assetTypeData, properties }
      };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.updateAssetType)
  async updateAssetType(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.updateAssetType, async ({ params, body }) => {

      const assetType = await this.assetTypeService.updateAssetType((params.id), body.assetType);
      await this.assetTypeService.updateAssetTypeProperties((params.id), body.properties);
      if (!assetType) {
        return {
          status: 500 as const,
          body: { assetType: null, properties: [], message: 'Error updating asset type' }
        };
      }

      const { properties, ...assetTypeData } = assetType;
      return {
        status: 200 as const,
        body: null
      };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.deleteAssetType)
  async deleteAssetType(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.deleteAssetType, async ({ params }) => {
      await this.assetTypeService.deleteAssetType((params.id));
      return {
        status: 204 as const,
        body: undefined
      };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.createProperty)
  async createProperty(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.createProperty, async ({ body }) => {

      this.logger.log(`Creating a new property for tenant:${body.tenantId}`);
      const propertyId = await this.PropertyService.createProperty({ ...body, tenantId: body.tenantId });
      return { status: 200, body: propertyId };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getProperties)
  async getProperties(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getProperties, async ({ params }) => {

      const properties = await this.PropertyService.getProperties(params.tenantId);

      return { status: 200, body: properties };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getProperty)
  async getProperty(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getProperty, async ({ params }) => {

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

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.updateProperty)
  async updateProperty(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.updateProperty, async ({ params, body }) => {

      const property = await this.PropertyService.updateProperty(params.id, body);
      if (!property) {
        return { status: 404, body: { message: 'Property not found' } };
      }
      return { status: 200, body: property };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.deleteProperty)
  async deleteProperty(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.deleteProperty, async ({ params }) => {
      const property = await this.PropertyService.deleteProperty((params.id));
      // if (!property) {
      //   return { status: 404, body: { message: 'Property not found' } };
      // }
      return { status: 200, body: { message: 'Property deleted' } };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.createTag)
  async createTag(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.createTag, async ({ body }) => {
      const tenantId = body.tenantId;

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

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getTags)
  async getTags(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getTags, async ({ params }) => {

      // Fetch only tags belonging to this tenant
      const tags = await this.tagsService.getTags(params.tenantId);
      return { status: 200, body: tags };
    });
  }

  @IsAdminRoute()
  @TsRestHandler(contract.systemAdmin.getTag)
  async getTag(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getTag, async ({ params }) => {
      const tag = await this.tagsService.getTag((params.id));

      // Validate tenant access

      return { status: 200, body: tag };
    });
  }

  @TsRestHandler(contract.settings.tags.deleteTag)
  async deleteTag(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.deleteTag, async ({ params }) => {

      const tag = await this.tagsService.getTag((params.id));

      // Validate tenant access before deleting

      const result = await this.tagsService.deleteTag((params.id));
      return { status: 200, body: result };
    });
  }



}
