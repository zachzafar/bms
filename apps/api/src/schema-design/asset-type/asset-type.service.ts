import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from 'src/database-schema';
import type { InsertAssetType, UpdateAssetType } from 'src/database-schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AssetTypeService {
    private readonly logger = new Logger(AssetTypeService.name);

    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>
    ){}
    
    async getAssetTypes(tenantId: string) {
        return this.db.query.AssetType.findMany({where: (assetType, { eq }) => eq(assetType.tenantId, tenantId)});
    }

    async getAssetType(id: number) {
        const assetType = await this.db.query.AssetType.findFirst({ where: (assetType, { eq }) => eq(assetType.id, id), with: { assetTypeHasProperties: { with: { assetProperty: true}}, } });

        if (!assetType) {
            throw new NotFoundException('Asset type not found');
        }
        const {
            description,
            tenantId,
            name,
            createdAt,
            updatedAt,
            assetTypeHasProperties,
          } = assetType || {};
       
        return {
            description,
            tenantId,
            id,
            name,
            createdAt,
            updatedAt,
            properties: assetTypeHasProperties?.map((relation) => relation.assetProperty) ?? []
        }
    }

    async createAssetType(data: InsertAssetType, properties: number[]) {
        try {
            const result = await this.db.transaction(async (tx) => {
                const [{ id }] = await tx
                    .insert(schema.AssetType)
                    .values(data)
                    .$returningId();

                if (properties.length > 0) {
                    await tx
                        .insert(schema.AssetTypeHasProperties)
                        .values(
                            properties.map(property => ({
                                assetTypeId: BigInt(id),
                                assetPropertyId: BigInt(property)
                            }))
                        );
                }

                return id;
            });

            return result;
        } catch (error) {
            this.logger.error(`Failed to create asset type: ${error}`);
            throw new InternalServerErrorException(
                `Failed to create asset type: ${error}`
            );
        }
    }

    async updateAssetType(id: number, data: UpdateAssetType) {
        await this.db.update(schema.AssetType).set(data).where(eq(schema.AssetType.id, id)).execute()
        return this.getAssetType(id);
    }

    async deleteAssetType(id: number) {
        return this.db.delete(schema.AssetType).where(eq(schema.AssetType.id, id));
    }

    async updateAssetTypeProperties(id: number, properties: number[]) {
        await this.db.delete(schema.AssetTypeHasProperties).where(eq(schema.AssetTypeHasProperties.assetTypeId, BigInt(id))).execute()
        if (properties.length > 0) {
            await this.db
                .insert(schema.AssetTypeHasProperties)
                .values(
                    properties.map(property => ({
                        assetTypeId: BigInt(id),
                        assetPropertyId: BigInt(property)
                    }))
                );
        }
    }
}
