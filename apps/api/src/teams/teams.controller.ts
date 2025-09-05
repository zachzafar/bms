import { Controller, Logger, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { contract as c}  from "@repo/api-contract"
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
// import { RequireRead, RequireWrite, RequireDelete, RequirePermissionsDecorator } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';

@UseGuards(PermissionsGuard)
@Controller('teams')
export class TeamsController {
    private readonly logger = new Logger(TeamsController.name);
    constructor(private TeamsService: TeamsService){}

    @TsRestHandler(c.teams.createTeam)
    @Roles(PermissionScope.TEAMS_WRITE)
    async createTeam(): Promise<ReturnType<typeof tsRestHandler>>{
        return tsRestHandler(c.teams.createTeam, async({ body }) => {
            const { id } = await this.TeamsService.create(body)
            return {
                status: 201,
                body: {
                    id
                }
            }
        })
    }

    // @TsRestHandler(c.teams.getTeam)
    // async getTeam(): Promise<ReturnType<typeof tsRestHandler>>{
    //     return tsRestHandler(c.teams.getTeam, async({ params }) => {
    //         const { id, tenant } = params
    //         const team = await this.TeamsService.findOne(id,tenant)

    //         if(!team){
    //             return {
    //                 status: 404,
    //                 body: {
    //                     message: "Team not found"
    //                 }
    //             }
    //         }

    //         const { name , tenantTeamToAsset, tenantTeamToUsers} = team
    //         const assets = tenantTeamToAsset.map((asset) => ({...asset.asset, assetTypeId: asset.asset.assetTypeId ? Number(asset.asset.assetTypeId) : undefined}))
    //         const users = tenantTeamToUsers.map((user) => user.user)

    //         return {
    //             status: 200,
    //             body: {
    //                 name,
    //                 assets,
    //                 users
    //             }
    //         }
    //     })
    // }

    @TsRestHandler(c.teams.getTeams)
    @Roles(PermissionScope.TEAMS_READ)
    async getTeams(): Promise<ReturnType<typeof tsRestHandler>>{
        return tsRestHandler(c.teams.getTeams, async({ params }) => {
            const { tenant } = params
            const teams = await this.TeamsService.findAll(tenant)
            return {
                status: 200,
                body: teams
            }
        })
    }

    @TsRestHandler(c.teams.updateTeam)
    @Roles(PermissionScope.TEAMS_WRITE)
    async updateTeam(): Promise<ReturnType<typeof tsRestHandler>>{
        return tsRestHandler(c.teams.updateTeam, async({ params, body }) => {
            const { id } = params

            
            await this.TeamsService.update(id,body)
            return {
                status: 200,
                body: {
                    message: "Team updated"
                }
            }
        })
    }

    @TsRestHandler(c.teams.deleteTeam)
    @Roles(PermissionScope.TEAMS_DELETE)
    async deleteTeam(): Promise<ReturnType<typeof tsRestHandler>>{
        return tsRestHandler(c.teams.deleteTeam, async({ params }) => {
            const { id } = params
            await this.TeamsService.remove(id)
            return {
                status: 200,
                body: {
                    message: "Team deleted"
                }
            }
        })
    }

    @TsRestHandler(c.teams.addUserToTeam)
    @Roles(PermissionScope.TEAMS_USERS_MANAGE)
    async addUserToTeam(): Promise<ReturnType<typeof tsRestHandler>>{
        return tsRestHandler(c.teams.addUserToTeam, async({ params }) => {
            const { id, userId } = params
            await this.TeamsService.addUserToTeam(userId,id)
            return {
                status: 200,
                body: {
                    message: "User added to team"
                }
            }
        })
    }

    @TsRestHandler(c.teams.removeUserFromTeam)
    @Roles(PermissionScope.TEAMS_USERS_MANAGE)
    async removeUserFromTeam(): Promise<ReturnType<typeof tsRestHandler>>{
        return tsRestHandler(c.teams.removeUserFromTeam, async({ params }) => {
            const { id, userId } = params
            await this.TeamsService.removeUserFromTeam(userId,id)
            return {
                status: 200,
                body: {
                    message: "User removed from team"
                }
            }
        })
    }
}
