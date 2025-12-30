import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';

@Injectable()
export class KeysService {

    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>
    ) { }

    async createKey(tenantId: string, name: string = "API Key") {
        try {
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

    async getKeys(tenantId: string) {
        try {
            const keys = await this.db.query.APIKeys.findMany({ where: (keys, { eq }) => eq(keys.tenantId, tenantId) })
            return keys
        } catch (error) {
            throw new InternalServerErrorException(error)
        }
    }

    async tenatHasKey(tenantId: string, key: string) {
        try {
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
