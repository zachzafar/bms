import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { eq, and, sql } from 'drizzle-orm';
import { randomBytes } from 'crypto';

@Injectable()
export class KeysService {
    private readonly logger = new Logger(KeysService.name);

    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>
    ) { }

    async createKey(tenantId: string, name: string = "API Key") {
        try {
            this.logger.log(`Creating API key "${name}" for tenant ${tenantId}`);
            const apiKey = `ak_${randomBytes(32).toString('hex')}`


            const key = await this.db.insert(schema.APIKeys).values({
                key: apiKey,
                name,
                tenantId,
            })
        } catch (error) {
            throw new InternalServerErrorException(error)
        }

    }

    async getKeys(tenantId: string, page: number = 1, pageSize: number = 10) {
        try {
            const offset = (page - 1) * pageSize;

            const totalCountResult = await this.db
                .select({ count: sql<number>`COUNT(*)` })
                .from(schema.APIKeys)
                .where(eq(schema.APIKeys.tenantId, tenantId))
                .execute();
            const totalCount = totalCountResult[0]?.count || 0;

            const results = await this.db.query.APIKeys.findMany({
                where: (keys, { eq }) => eq(keys.tenantId, tenantId),
                limit: pageSize,
                offset: offset,
            });

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
        } catch (error) {
            throw new InternalServerErrorException(error)
        }
    }

    async tenatHasKey(tenantId: string, key: string) {
        try {
            this.logger.log(`Verifying API key for tenant ${tenantId}`);
            const keys = await this.db.query.APIKeys.findMany({ where: (keys, { eq }) => eq(keys.tenantId, tenantId) && eq(keys.key, key) })
            return keys.length > 0
        } catch (error) {
            throw new InternalServerErrorException(error)
        }
    }

    async isValidKey(key: string) {
        try {
            const keys = await this.db.query.APIKeys.findMany({ where: (keys, { eq }) => eq(keys.key, key) })
            return keys.length > 0
        } catch (error) {
            throw new InternalServerErrorException(error)
        }
    }

    async deleteKey(tenantId: string, keyId: string) {
        try {
            this.logger.log(`Deleting API key ${keyId} for tenant ${tenantId}`);
            const existing = await this.db.query.APIKeys.findFirst({
                where: and(eq(schema.APIKeys.id, keyId), eq(schema.APIKeys.tenantId, tenantId)),
            });

            if (!existing) {
                throw new NotFoundException('Key not found');
            }

            await this.db
                .delete(schema.APIKeys)
                .where(and(eq(schema.APIKeys.id, keyId), eq(schema.APIKeys.tenantId, tenantId)));
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
