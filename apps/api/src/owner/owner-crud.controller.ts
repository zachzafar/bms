import { Controller, Headers, Logger, UseGuards } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract as c } from "@repo/api-contract";
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';

@UseGuards(PermissionsGuard)
@Controller()
export class OwnerCrudController {
    private readonly logger = new Logger(OwnerCrudController.name);
    constructor(private ownerService: OwnerService) {}

    @TsRestHandler(c.owners.createOwner)
    @Roles(PermissionScope.OWNERS_WRITE)
    async createOwner(@Headers() headers: any) {
        return tsRestHandler(c.owners.createOwner, async ({ body }) => {
            const tenantId = headers['x-tenant-id'];
            const id = await this.ownerService.createOwner(tenantId, body);
            return { status: 200, body: { id } };
        });
    }

    @TsRestHandler(c.owners.getOwners)
    @Roles(PermissionScope.OWNERS_READ)
    async getOwners(@Headers() headers: any) {
        return tsRestHandler(c.owners.getOwners, async ({ query }) => {
            const tenantId = headers['x-tenant-id'];
            const page = query.page ? Number(query.page) : 1;
            const pageSize = query.pageSize ? Number(query.pageSize) : 10;
            const search = query.search;

            const owners = await this.ownerService.getOwners(tenantId, page, pageSize, search);
            return { status: 200, body: owners };
        });
    }

    @TsRestHandler(c.owners.getOwner)
    @Roles(PermissionScope.OWNERS_READ)
    async getOwner(@Headers() headers: any) {
        return tsRestHandler(c.owners.getOwner, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            const owner = await this.ownerService.getOwnerById(tenantId, params.id);
            if (!owner) {
                return { status: 404, body: { message: 'Owner not found' } };
            }
            return { status: 200, body: owner };
        });
    }

    @TsRestHandler(c.owners.updateOwner)
    @Roles(PermissionScope.OWNERS_WRITE)
    async updateOwner(@Headers() headers: any) {
        return tsRestHandler(c.owners.updateOwner, async ({ params, body }) => {
            const tenantId = headers['x-tenant-id'];
            await this.ownerService.updateOwner(tenantId, params.id, body);
            return { status: 200, body: { message: 'Owner updated successfully' } };
        });
    }

    @TsRestHandler(c.owners.deleteOwner)
    @Roles(PermissionScope.OWNERS_DELETE)
    async deleteOwner(@Headers() headers: any) {
        return tsRestHandler(c.owners.deleteOwner, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            await this.ownerService.deleteOwner(tenantId, params.id);
            return { status: 200, body: { message: 'Owner deleted successfully' } };
        });
    }

    @TsRestHandler(c.owners.assignAsset)
    @Roles(PermissionScope.OWNERS_WRITE)
    async assignAsset() {
        return tsRestHandler(c.owners.assignAsset, async ({ params, body }) => {
            await this.ownerService.assignAsset(params.id, body.assetId);
            return { status: 200, body: { message: 'Asset assigned successfully' } };
        });
    }

    @TsRestHandler(c.owners.unassignAsset)
    @Roles(PermissionScope.OWNERS_WRITE)
    async unassignAsset() {
        return tsRestHandler(c.owners.unassignAsset, async ({ params }) => {
            await this.ownerService.unassignAsset(params.id, params.assetId);
            return { status: 200, body: { message: 'Asset unassigned successfully' } };
        });
    }

    @TsRestHandler(c.owners.getOwnerAssetsAdmin)
    @Roles(PermissionScope.OWNERS_READ)
    async getOwnerAssetsAdmin() {
        return tsRestHandler(c.owners.getOwnerAssetsAdmin, async ({ params, query }) => {
            const page = query.page ? Number(query.page) : 1;
            const pageSize = query.pageSize ? Number(query.pageSize) : 10;
            const result = await this.ownerService.getOwnerAssetsAdmin(params.id, page, pageSize);
            return { status: 200, body: result };
        });
    }
}
