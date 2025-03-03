import { Controller, Logger } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { contract as c}  from "@repo/api-contract"
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

@Controller('teams')
export class TeamsController {
    private readonly logger = new Logger(TeamsController.name);
    constructor(private TeamsService: TeamsService){}

    @TsRestHandler(c.teams.createTeam)
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

    @TsRestHandler(c.teams.getTeam)
    async getTeam(): Promise<ReturnType<typeof tsRestHandler>>{
        return tsRestHandler(c.teams.getTeam, async({ params }) => {
            const { id, tenant } = params
            const team = await this.TeamsService.findOne(id,tenant)

            if(!team){
                return {
                    status: 404,
                    body: {
                        message: "Team not found"
                    }
                }
            }

            const { name , tenantTeamToAsset, tenantTeamToUsers} = team
            const assets = tenantTeamToAsset.map((asset) => ({...asset.asset, assetTypeId: asset.asset.assetTypeId ? Number(asset.asset.assetTypeId) : undefined}))
            const users = tenantTeamToUsers.map((user) => user.user)

            return {
                status: 200,
                body: {
                    name,
                    assets,
                    users
                }
            }
        })
    }

    @TsRestHandler(c.teams.getTeams)
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
