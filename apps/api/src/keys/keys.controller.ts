import { Controller, Logger, Headers } from '@nestjs/common';
import { KeysService } from './keys.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { RequireRead, RequireWrite, RequireDelete } from 'src/auth/decorators/permissions.decorator';

@Controller()
export class KeysController {
    private readonly logger = new Logger(KeysController.name);

    constructor(private keysService: KeysService) { }

    @TsRestHandler(contract.keys.createKey)
    @RequireWrite('keys')
    async createKey(@Headers() headers: any,): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.keys.createKey, async ({ body }) => {
            const tenantId = headers['x-tenant-id'];
            const key = await this.keysService.createKey(tenantId, body.name)

            return {
                status: 201,
                body: {
                    key,
                    message: "Key created"
                }
            }
        })
    }

    @TsRestHandler(contract.keys.getKeys)
    @RequireRead('keys')
    async getKeys(@Headers() headers: any,): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.keys.getKeys, async () => {
            const tenantId = headers['x-tenant-id'];
            const keys = await this.keysService.getKeys(tenantId)

            return {
                status: 200,
                body: keys
            }
        })
    }

    @TsRestHandler(contract.keys.deleteKey)
    @RequireDelete('keys')
    async deleteKey(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.keys.deleteKey, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            await this.keysService.deleteKey(tenantId, params.keyId);

            return {
                status: 204,
                body: null
            };
        });
    }

}
