import { Controller, Logger, UseGuards } from '@nestjs/common';
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
            const { tenant, adminUser } = await this.authService.createTenantWithAdmin(body.tenant, body.adminUser);
            this.logger.log(`Tenant created with id: ${tenant.id} and admin user created with id: ${adminUser.id}`);
            return { status: 201, body: { tenant, adminUser } };
        });
     
    } 

    @Public()
    @UseGuards(LocalAuthGuard)
    @TsRestHandler(contract.auth.login)
    async login(): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log('User login attempt');
        return tsRestHandler(contract.auth.login, async ({ body }) => {
            const { user, accessToken, refreshToken,tenant } = await this.authService.login(body.email, body.password);
            this.logger.log(`User logged in with email: ${user.email}`);
            return { status: 200, body: { user, token:accessToken,refreshToken, tenant } };
        });
    }

    @Public()
    @UseGuards(RefreshAuthGuard)
    @TsRestHandler(contract.auth.refreshToken)
    async refreshToken(): Promise<ReturnType<typeof tsRestHandler>> {
        this.logger.log('Refreshing token');
        return tsRestHandler(contract.auth.refreshToken, async ({ headers }) => {
            const { user, accessToken, refreshToken, tenant } = await this.authService.refreshToken(headers.user);
            this.logger.log(`Token refreshed for user ID: ${user.id}`);
            return { status: 200, body: { user, token:accessToken,refreshToken,tenant } };
        });
    }

    @TsRestHandler(contract.auth.logout)
    async logout(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.auth.logout, async ({ headers }) => {
            await this.authService.logout(headers.user.id);
            return { status: 204, body: { message: 'Logged out' } };
        });
    }
}
