import { Injectable, Inject, Logger, InternalServerErrorException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { eq, and, sql, or, like, isNull } from 'drizzle-orm';
import { hash } from 'argon2';

@Injectable()
export class OwnerService {
    private readonly logger = new Logger(OwnerService.name);
    constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) { }

    async createOwner(
        tenantId: string,
        data: {
            name: string;
            email: string;
            phone?: string | null | undefined;
            address?: string | null | undefined;
        }
    ): Promise<number> {
        let ownerId: number;


        // Create Owner record
        const [{ id }] = await this.db.insert(schema.Owner).values({
            tenantId,
            name: data.name,
            email: data.email,
            phone: data.phone ?? null,
            address: data.address ?? null,
        }).$returningId();

        ownerId = id;


        return ownerId!;
    }

    async getOwners(
        tenantId: string,
        page: number = 1,
        pageSize: number = 10,
        search?: string
    ): Promise<{ data: schema.SelectOwner[]; pagination: any }> {
        const offset = (page - 1) * pageSize;

        const baseConditions = [
            eq(schema.Owner.tenantId, tenantId),
            isNull(schema.Owner.deletedAt),
        ];

        const searchCondition = search ? or(
            like(schema.Owner.name, `%${search}%`),
            like(schema.Owner.email, `%${search}%`),
            like(schema.Owner.phone, `%${search}%`),
            like(schema.Owner.address, `%${search}%`)
        ) : undefined;

        const whereConditions = searchCondition
            ? and(...baseConditions, searchCondition)
            : and(...baseConditions);

        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.Owner)
            .where(whereConditions)
            .execute();
        const totalCount = totalCountResult[0]?.count || 0;

        const owners = await this.db
            .select()
            .from(schema.Owner)
            .where(whereConditions)
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
            data: owners,
            pagination: paginationData,
        };
    }

    async getOwnerById(tenantId: string, id: number): Promise<schema.SelectOwner | undefined> {
        return this.db.query.Owner.findFirst({
            where: (o, { eq, and, isNull }) => and(
                eq(o.tenantId, tenantId),
                eq(o.id, id),
                isNull(o.deletedAt)
            )
        });
    }

    async updateOwner(
        tenantId: string,
        id: number,
        data: { name?: string; email?: string; password?: string; phone?: string | null; address?: string | null; roles?: number[] }
    ): Promise<void> {
        await this.db.transaction(async (tx) => {
            const owner = await tx.query.Owner.findFirst({
                where: (o, { eq, and }) => and(eq(o.id, id), eq(o.tenantId, tenantId))
            });

            if (!owner) return;

            // Update owner_details
            const ownerUpdate: any = {};
            if (data.name !== undefined) ownerUpdate.name = data.name;
            if (data.email !== undefined) ownerUpdate.email = data.email;
            if (data.phone !== undefined) ownerUpdate.phone = data.phone;
            if (data.address !== undefined) ownerUpdate.address = data.address;

            if (Object.keys(ownerUpdate).length > 0) {
                await tx.update(schema.Owner)
                    .set(ownerUpdate)
                    .where(and(eq(schema.Owner.id, id), eq(schema.Owner.tenantId, tenantId)));
            }
        });
    }

    async deleteOwner(tenantId: string, id: number): Promise<void> {
        // Soft delete the owner
        await this.db.update(schema.Owner)
            .set({ deletedAt: new Date() })
            .where(and(eq(schema.Owner.id, id), eq(schema.Owner.tenantId, tenantId)));
    }

    async assignAsset(ownerId: number, assetId: string): Promise<void> {
        // Remove any existing assignment for this asset (reassign)
        await this.db.delete(schema.OwnerHasAssets)
            .where(eq(schema.OwnerHasAssets.assetId, assetId));

        await this.db.insert(schema.OwnerHasAssets).values({
            ownerId,
            assetId,
        });
    }

    async unassignAsset(ownerId: number, assetId: string): Promise<void> {
        await this.db.delete(schema.OwnerHasAssets)
            .where(and(
                eq(schema.OwnerHasAssets.ownerId, ownerId),
                eq(schema.OwnerHasAssets.assetId, assetId)
            ));
    }

    async getOwnerAssetsAdmin(ownerId: number, page: number = 1, pageSize: number = 10) {
        const offset = (page - 1) * pageSize;

        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.OwnerHasAssets)
            .innerJoin(schema.Asset, eq(schema.OwnerHasAssets.assetId, schema.Asset.id))
            .where(and(
                eq(schema.OwnerHasAssets.ownerId, ownerId),
                isNull(schema.Asset.deletedAt)
            ));
        const totalCount = totalCountResult[0]?.count || 0;

        const assets = await this.db
            .select({ asset: schema.Asset })
            .from(schema.OwnerHasAssets)
            .innerJoin(schema.Asset, eq(schema.OwnerHasAssets.assetId, schema.Asset.id))
            .where(and(
                eq(schema.OwnerHasAssets.ownerId, ownerId),
                isNull(schema.Asset.deletedAt)
            ))
            .limit(pageSize)
            .offset(offset);

        return {
            data: assets.map(a => a.asset),
            pagination: {
                page,
                pageSize,
                totalCount,
                totalPages: Math.ceil(totalCount / pageSize),
                hasNextPage: page * pageSize < totalCount,
                hasPreviousPage: page > 1,
            },
        };
    }
}
