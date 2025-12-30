import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class TeamsService {
    constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>){}

    async findAll(tenant: string) {
        return await this.db.select().from(schema.TenantTeams).where(eq(schema.TenantTeams.tenantId,tenant));
    }

    async findOne(id: number,tenant: string) {
        return await this.db.query.TenantTeams.findFirst({where: (team, {eq, and}) => and(eq(team.id, id),eq(team.tenantId,tenant)), with: {
                tenantTeamToAsset: {
                    with: {
                        asset: true
                    }
                },
                tenantTeamToUsers: {
                    with: {
                        user: true
                    }
                }
        }});

        
    }

    async create(team: schema.InsertTenanTeam) {
        return await this.db.insert(schema.TenantTeams).values(team).$returningId().execute()[0];
    }

    async update(id: number, team: Partial<schema.InsertTenanTeam>) {
        return await this.db.update(schema.TenantTeams).set(team).where(eq(schema.TenantTeams.id,id));
    }

    async remove(id: number) {
        return await this.db.delete(schema.TenantTeams).where(eq(schema.TenantTeams.id,id));
    }

    async addUserToTeam(userId: string, teamId: number) {
        return await this.db.insert(schema.TenantTeamHasUsers).values({userId, teamId: (teamId)});
    }

    async removeUserFromTeam(userId: string, teamId: number) {
        return await this.db.delete(schema.TenantTeamHasUsers).where(and(eq(schema.TenantTeamHasUsers.userId,userId),eq(schema.TenantTeamHasUsers.teamId,(teamId))))
    }
}
