import { Controller, UseGuards } from '@nestjs/common';
import { contract } from '@repo/api-contract';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AuthService } from './auth.service';
import { RefreshAuthGuard } from './guards/refresh-auth/refresh-auth.guard';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { Public } from './decorators/public.decorator';

console.log('contract', contract);

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Public()
    @TsRestHandler(contract.auth.registerTenant)
    async createTenant(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.auth.registerTenant, async ({ body }) => {
            const { tenant, adminUser } = await this.authService.createTenantWithAdmin(body.tenant, body.adminUser);
            return { status: 201, body: { tenant, adminUser } };
        });
     
    } 

    @Public()
    @UseGuards(LocalAuthGuard)
    @TsRestHandler(contract.auth.login)
    async login(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.auth.login, async ({ body }) => {
            const { user, accessToken, refreshToken,tenant } = await this.authService.login(body.email, body.password);
            return { status: 200, body: { user, token:accessToken,refreshToken, tenant } };
        });
    }

    @Public()
    @UseGuards(RefreshAuthGuard)
    @TsRestHandler(contract.auth.refreshToken)
    async refreshToken(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.auth.refreshToken, async ({ headers }) => {
            const { user, accessToken, refreshToken, tenant } = await this.authService.refreshToken(headers.user);
            return { status: 200, body: { user, token:accessToken,refreshToken,tenant } };
        });
    }

    // @TsRestHandler(contract.auth.logout)
    // async logout(): Promise<ReturnType<typeof tsRestHandler>> {
    //     return tsRestHandler(contract.auth.logout, async ({ headers }) => {
    //         await this.authService.logout(headers.Authorization);
    //         return { status: 204, message: 'Logged out' };
    //     });
    // }
}
