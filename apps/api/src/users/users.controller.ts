import { Controller, Headers, Logger, NotFoundException, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract as c } from "@repo/api-contract"
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
            const { roles } = body;
            const userId = await this.UserService.createUser(body, tenantId, roles);
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
            const { user, roles } = body;
            await this.UserService.update(id, tenantId, user, roles);
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
}
