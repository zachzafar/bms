import { Controller, Headers, Logger, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract as c } from "@repo/api-contract";
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';

@UseGuards(PermissionsGuard)
@Controller()
export class CustomersController {
    private readonly logger = new Logger(CustomersController.name);
    constructor(private customersService: CustomersService) {}

    @TsRestHandler(c.customers.createCustomer)
    @Roles(PermissionScope.CUSTOMERS_WRITE)
    async createCustomer(@Headers() headers: any) {
        return tsRestHandler(c.customers.createCustomer, async ({ body }) => {
            const tenantId = headers['x-tenant-id'];
            const id = await this.customersService.createCustomer(tenantId, body);
            return { status: 200, body: { id } };
        });
    }

    @TsRestHandler(c.customers.getCustomers)
    @Roles(PermissionScope.CUSTOMERS_READ)
    async getCustomers(@Headers() headers: any) {
        return tsRestHandler(c.customers.getCustomers, async ({ query }) => {
            const tenantId = headers['x-tenant-id'];
            const page = query.page ? Number(query.page) : 1;
            const pageSize = query.pageSize ? Number(query.pageSize) : 10;
            const search = query.search;

            const customers = await this.customersService.getCustomers(tenantId, page, pageSize, search);
            return { status: 200, body: customers };
        });
    }

    @TsRestHandler(c.customers.getCustomer)
    @Roles(PermissionScope.CUSTOMERS_READ)
    async getCustomer(@Headers() headers: any) {
        return tsRestHandler(c.customers.getCustomer, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            const customer = await this.customersService.getCustomerById(tenantId, params.id);
            if (!customer) {
                return { status: 404, body: { message: 'Customer not found' } };
            }
            return { status: 200, body: customer };
        });
    }

    @TsRestHandler(c.customers.updateCustomer)
    @Roles(PermissionScope.CUSTOMERS_WRITE)
    async updateCustomer(@Headers() headers: any) {
        return tsRestHandler(c.customers.updateCustomer, async ({ params, body }) => {
            const tenantId = headers['x-tenant-id'];
            await this.customersService.updateCustomer(tenantId, params.id, body);
            return { status: 200, body: { message: 'Customer updated successfully' } };
        });
    }

    @TsRestHandler(c.customers.deleteCustomer)
    @Roles(PermissionScope.CUSTOMERS_DELETE)
    async deleteCustomer(@Headers() headers: any) {
        return tsRestHandler(c.customers.deleteCustomer, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            await this.customersService.deleteCustomer(tenantId, params.id);
            return { status: 200, body: { message: 'Customer deleted successfully' } };
        });
    }

    // ==================== CUSTOMER TYPES ====================

    @TsRestHandler(c.customers.createCustomerType)
    @Roles(PermissionScope.CUSTOMERS_WRITE)
    async createCustomerType(@Headers() headers: any) {
        return tsRestHandler(c.customers.createCustomerType, async ({ body }) => {
            const tenantId = headers['x-tenant-id'];
            const id = await this.customersService.createCustomerType(tenantId, body);
            return { status: 200, body: { id } };
        });
    }

    @TsRestHandler(c.customers.getCustomerTypes)
    @Roles(PermissionScope.CUSTOMERS_READ)
    async getCustomerTypes(@Headers() headers: any) {
        return tsRestHandler(c.customers.getCustomerTypes, async ({ query }) => {
            const tenantId = headers['x-tenant-id'];
            const page = query.page ? Number(query.page) : 1;
            const pageSize = query.pageSize ? Number(query.pageSize) : 10;

            const customerTypes = await this.customersService.getCustomerTypes(tenantId, page, pageSize);
            return { status: 200, body: customerTypes };
        });
    }

    @TsRestHandler(c.customers.getCustomerType)
    @Roles(PermissionScope.CUSTOMERS_READ)
    async getCustomerType(@Headers() headers: any) {
        return tsRestHandler(c.customers.getCustomerType, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            const customerType = await this.customersService.getCustomerTypeById(tenantId, params.id);
            if (!customerType) {
                return { status: 404, body: { message: 'Customer type not found' } };
            }
            return { status: 200, body: customerType };
        });
    }

    @TsRestHandler(c.customers.updateCustomerType)
    @Roles(PermissionScope.CUSTOMERS_WRITE)
    async updateCustomerType(@Headers() headers: any) {
        return tsRestHandler(c.customers.updateCustomerType, async ({ params, body }) => {
            const tenantId = headers['x-tenant-id'];
            await this.customersService.updateCustomerType(tenantId, params.id, body);
            return { status: 200, body: { message: 'Customer type updated successfully' } };
        });
    }

    @TsRestHandler(c.customers.deleteCustomerType)
    @Roles(PermissionScope.CUSTOMERS_DELETE)
    async deleteCustomerType(@Headers() headers: any) {
        return tsRestHandler(c.customers.deleteCustomerType, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            await this.customersService.deleteCustomerType(tenantId, params.id);
            return { status: 200, body: { message: 'Customer type deleted successfully' } };
        });
    }
}
