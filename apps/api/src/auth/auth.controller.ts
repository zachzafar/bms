import { Controller, Logger, UseGuards, Post, Request } from '@nestjs/common';
import { contract } from '@repo/api-contract';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AuthService } from './auth.service';
import { RefreshAuthGuard } from './guards/refresh-auth/refresh-auth.guard';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { Public } from './decorators/public.decorator';


@Controller()
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    constructor(private authService: AuthService) {}

    @Public()
    @TsRestHandler(contract.auth.registerTenant)
    async createTenant(): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log('Creating a new tenant');
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
            return { status: 200, body: { user, token:accessToken,refreshToken, tenants } };
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
}
