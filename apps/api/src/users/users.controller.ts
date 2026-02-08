import { Controller, Headers, Logger, NotFoundException, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract as c } from "@repo/api-contract"
// import { RequireRead, RequireWrite, RequireDelete, RequirePermissionsDecorator } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';

@UseGuards(PermissionsGuard)
@Controller()
export class UsersController {
    private readonly logger = new Logger(UsersController.name);
    constructor(private UserService: UsersService) { }

    @TsRestHandler(c.users.createUser)
    @Roles(PermissionScope.USERS_WRITE)
    async createUser(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log(`Creating a new user`);
        return tsRestHandler(c.users.createUser, async ({ body }) => {
            const tenantId = headers['x-tenant-id'];

            const { roles, customerDetails } = body;
            this.logger.log(`Trying to see customer details ${JSON.stringify(customerDetails)}`)
            const userId = await this.UserService.createUser(body, tenantId, roles, customerDetails);
            return { status: 200, body: { id: userId } };
        });
    }

    @TsRestHandler(c.users.getUser)
    @Roles(PermissionScope.USERS_READ)
    async getUser(): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log(`Getting a user`);
        return tsRestHandler(c.users.getUser, async ({ params }) => {
            const { id, tenant } = params;
            const user = await this.UserService.findOne(id, tenant);
            if (!user)
                throw new NotFoundException(`User with id ${id} not found`);

            return { status: 200, body: user };
        });
    }

    @TsRestHandler(c.users.getUsers)
    @Roles(PermissionScope.USERS_READ)
    async getUsers(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log(`Getting all users`);
        return tsRestHandler(c.users.getUsers, async ({ query }) => {
            const tenantId = headers['x-tenant-id'];
            const page = query.page ? Number(query.page) : 1;
            const pageSize = query.pageSize ? Number(query.pageSize) : 10;

            const users = await this.UserService.findAll(tenantId, page, pageSize);
            return { status: 200, body: users };
        });
    }

    @TsRestHandler(c.users.updateUser)
    @Roles(PermissionScope.USERS_WRITE)
    async updateUser(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log(`Updating a user`);
        return tsRestHandler(c.users.updateUser, async ({ params, body }) => {
            const { id } = params;
            const tenantId = headers['x-tenant-id'];
            const { user, roles,customer,owner } = body;
            await this.UserService.update(id, tenantId, user, roles, {...owner, userId: id}, {...customer, userId: id});
            return { status: 200, body: { message: 'User updated successfully' } };

        });
    }

    @TsRestHandler(c.users.deleteUser)
    @Roles(PermissionScope.USERS_DELETE)
    async deleteUser(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log(`Deleting a user`);
        return tsRestHandler(c.users.deleteUser, async ({ params }) => {
            const { id } = params;
            const tenantId = headers['x-tenant-id'];
            await this.UserService.remove(id, tenantId);
            return {
                status: 204 as const,
                body: undefined
            };
        });
    }

    @TsRestHandler(c.users.getCustomers)
    @Roles(PermissionScope.CUSTOMERS_READ)
    async getCustomers(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log(`Getting all customers`);
        return tsRestHandler(c.users.getCustomers, async ({ query }) => {
            const tenantId = headers['x-tenant-id'];
            const page = query.page ? Number(query.page) : 1;
            const pageSize = query.pageSize ? Number(query.pageSize) : 10;
            const search = query.search;

            const customers = await this.UserService.getCustomers(tenantId, page, pageSize, search);
            return { status: 200, body: customers };
        });
    }

    @TsRestHandler(c.users.getOwners)
    @Roles(PermissionScope.CUSTOMERS_READ)
    async getOwners(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log(`Getting all owners`);
        return tsRestHandler(c.users.getOwners, async ({ query }) => {
            const tenantId = headers['x-tenant-id'];
            const page = query.page ? Number(query.page) : 1;
            const pageSize = query.pageSize ? Number(query.pageSize) : 10;
            const search = query.search;

            const owners = await this.UserService.getOwners(tenantId, page, pageSize, search);
            return { status: 200, body: owners };
        })
    }

    // ==================== CUSTOMER TYPES ====================

    @TsRestHandler(c.users.createCustomerType)
    @Roles(PermissionScope.USERS_WRITE)
    async createCustomerType(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log(`Creating a new customer type`);
        return tsRestHandler(c.users.createCustomerType, async ({ body }) => {
            const tenantId = headers['x-tenant-id'];
            const id = await this.UserService.createCustomerType(tenantId, body);
            return { status: 200, body: { id } };
        });
    }

    @TsRestHandler(c.users.getCustomerTypes)
    @Roles(PermissionScope.USERS_READ)
    async getCustomerTypes(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log(`Getting all customer types`);
        return tsRestHandler(c.users.getCustomerTypes, async ({ query }) => {
            const tenantId = headers['x-tenant-id'];
            const page = query.page ? Number(query.page) : 1;
            const pageSize = query.pageSize ? Number(query.pageSize) : 10;

            const customerTypes = await this.UserService.getCustomerTypes(tenantId, page, pageSize);
            return { status: 200, body: customerTypes };
        });
    }

    @TsRestHandler(c.users.getCustomerType)
    @Roles(PermissionScope.USERS_READ)
    async getCustomerType(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log(`Getting a customer type`);
        return tsRestHandler(c.users.getCustomerType, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            const customerType = await this.UserService.getCustomerTypeById(tenantId, params.id);
            if (!customerType) {
                return { status: 404, body: { message: 'Customer type not found' } };
            }
            return { status: 200, body: customerType };
        });
    }

    @TsRestHandler(c.users.updateCustomerType)
    @Roles(PermissionScope.USERS_WRITE)
    async updateCustomerType(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log(`Updating a customer type`);
        return tsRestHandler(c.users.updateCustomerType, async ({ params, body }) => {
            const tenantId = headers['x-tenant-id'];
            await this.UserService.updateCustomerType(tenantId, params.id, body);
            return { status: 200, body: { message: 'Customer type updated successfully' } };
        });
    }

    @TsRestHandler(c.users.deleteCustomerType)
    @Roles(PermissionScope.USERS_DELETE)
    async deleteCustomerType(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log(`Deleting a customer type`);
        return tsRestHandler(c.users.deleteCustomerType, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            await this.UserService.deleteCustomerType(tenantId, params.id);
            return { status: 200, body: { message: 'Customer type deleted successfully' } };
        });
    }
}
