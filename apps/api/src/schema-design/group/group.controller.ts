import { Controller } from '@nestjs/common';
import { GroupService } from './group.service';
import { TsRest, tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';

@Controller('group')
export class GroupController {
    constructor(private groupService: GroupService){}

    @TsRestHandler(contract.settings.)
    async getGroups(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.group.getGroups, async () => {
            const groups = await this.groupService.getGroups();
            return { status: 200, body: groups };
        });
    }

    @TsRestHandler(contract.settings.group.getGroup)
    async getGroupById(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.group.getGroup, async ({ params }) => {
            const group = await this.groupService.getGroupById(params.id);
            if (!group) {
                return { status: 404, body: { message: 'Group not found'} };
            }
            return { status: 200, body: group };
        });
    }

    @TsRestHandler(contract.settings.group.createGroup)
    async createGroup(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.group.createGroup, async ({ body }) => {
            const group = await this.groupService.createGroup(body);

            if (!group) {
                return { status: 500, body: { message: 'Error creating group' } };
            }

            return { status: 201, body: group };
        });
    }

    @TsRestHandler(contract.settings.group.updateGroup)
    async updateGroup(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.group.updateGroup, async ({ params, body }) => {
            const group = await this.groupService.updateGroup(params.id, body);

            if (!group) {
                return { status: 500, body: { message: 'Error updating group' } };
            }

            return { status: 200, body: group };
        });
    }

    @TsRestHandler(contract.settings.group.deleteGroup)
    async deleteGroup(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.group.deleteGroup, async ({ params }) => {
            await this.groupService.deleteGroup(params.id);
            return { status: 204, body: { message: 'Group deleted' } };
        });
    }
    
}
