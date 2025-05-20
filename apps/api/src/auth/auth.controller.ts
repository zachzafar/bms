import { Controller, Logger, UseGuards, Post, Request, Headers, InternalServerErrorException } from '@nestjs/common';
import { contract } from '@repo/api-contract';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AuthService } from './auth.service';
import { RefreshAuthGuard } from './guards/refresh-auth/refresh-auth.guard';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { Public } from './decorators/public.decorator';
import { PasswordRestService } from './password-rest/password-rest.service';

@Controller()
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    constructor(private authService: AuthService, private passwordResetService: PasswordRestService) {}

    @Public()
    @TsRestHandler(contract.auth.registerTenant)
    async createTenant(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.auth.registerTenant, async ({ body }) => {
            const { tenantId, userId } = await this.authService.createTenantWithAdmin(body.tenant, body.adminUser);
            this.logger.log(`Tenant created with id: ${tenantId} and admin user created with id: ${userId}`);
            return { status: 201, body: { tenantId, userId } };
        });
     
    } 

    @Public()
    @UseGuards(LocalAuthGuard)
    @TsRestHandler(contract.auth.login)
    async login(): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log('User login attempt');
        return tsRestHandler(contract.auth.login, async ({ body }) => {
            const { user, accessToken, refreshToken,tenants } = await this.authService.login(body.email, body.password);
            this.logger.log(`User logged in with email: ${user.email}`);
            return { status: 200, body: { user: {
                ...user,
                roles: []
            }, token:accessToken,refreshToken, tenants } };
        });
    }
    @Public()
    @UseGuards(RefreshAuthGuard)
    @Post('refresh')
    async refreshToken(@Request() req) {
        const { user, accessToken, refreshToken } = await this.authService.refreshToken(req.user.id);
            this.logger.log(`Token refreshed for user ID: ${user.id}`);
            return { status: 200, body: { user, token:accessToken,refreshToken } };
    }


    @TsRestHandler(contract.auth.logout)
    async logout(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.auth.logout, async ({ body }) => {
            await this.authService.logout(body.userId);
            this.logger.log(`User with user ID: ${body.userId} logged out`);
            return { status: 204, body: { message: 'Logged out' } };
        });
    }

    @TsRestHandler(contract.auth.getPermissions)
    async getPermissions(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.auth.getPermissions, async () => {
            const permissions = await this.authService.getPermissions();
            
            return { status: 200, body: permissions };
        })
    }

    @TsRestHandler(contract.auth.getRoles)
    async getRoles(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.auth.getRoles, async () => {
            const tenantId = headers['x-tenant-id'];
            const roles = (await this.authService.getRoles(tenantId)).map(role => {
                return {
                    roleId: role.id,
                    name: role.name,
                    permissions: role.rolesToPermissions.map(permission => permission.permission)
                }
            })
            
            return { status: 200, body: roles };
        })
    }

    @TsRestHandler(contract.auth.createRole)
    async createRole(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.auth.createRole, async ({ body }) => {
            const tenantId = headers['x-tenant-id'];
            const role = await this.authService.createRole(tenantId,body.name,body.permissions);
            this.logger.log(`Role created with id: ${role}`);
            if (role === 0) {
                return { status: 400, body: { message: 'Error occured while creating role' } };
            }
            return { status: 201, body: {message: "role created successfully"} };
        })
    }

    @TsRestHandler(contract.auth.updateRole)
    async updateRole(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.auth.updateRole, async ({ params, body }) => {
            const tenantId = headers['x-tenant-id'];
            const updateSuccessful = await this.authService.updateRole(tenantId,params.roleId,body.name,body.permissions);

            if (!updateSuccessful) {
                throw new InternalServerErrorException(`Error occured while updating role`);
            }

            return { status: 201, body: {message: "role updated successfully"} };
        })
    }

    @TsRestHandler(contract.auth.deleteRole)
    async deleteRole(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.auth.deleteRole, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            await this.authService.deleteRole(tenantId,params.roleId);

            return { status: 204, body: {message: "role deleted successfully"} };
        })
    }

    @Public()
    @TsRestHandler(contract.auth.sendPasswordResetEmail)
    async sendPasswordResetEmail(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.auth.sendPasswordResetEmail, async ({ body }) => {
            await this.passwordResetService.createPasswordResetToken(body.email);
            this.logger.log(`Password reset email sent to: ${body.email}`);
            return { status: 200, body: { message: 'Password reset email sent' } };
        })
    }

    @Public()
    @TsRestHandler(contract.auth.resetPassword)
    async resetPassword(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.auth.resetPassword, async ({ body }) => {
            await this.passwordResetService.updatePassword(body.token, body.password);
            this.logger.log(`Password reset for token: ${body.token}`);
            return { status: 200, body: { message: 'Password reset successfully' } };
        })
    }

}
