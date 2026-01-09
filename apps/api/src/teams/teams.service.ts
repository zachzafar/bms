import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { and, eq, sql } from 'drizzle-orm';

@Injectable()
export class TeamsService {
    constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>){}

    async findAll(tenant: string, page: number = 1, pageSize: number = 10) {
        const offset = (page - 1) * pageSize;

        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.TenantTeams)
            .where(eq(schema.TenantTeams.tenantId, tenant))
            .execute();
        const totalCount = totalCountResult[0]?.count || 0;

        const results = await this.db
            .select()
            .from(schema.TenantTeams)
            .where(eq(schema.TenantTeams.tenantId, tenant))
            .limit(pageSize)
            .offset(offset);

        const paginationData = {
            page,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            hasNextPage: page * pageSize < totalCount,
            hasPreviousPage: page > 1,
        };

        return {
            data: results,
            pagination: paginationData,
        };
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
