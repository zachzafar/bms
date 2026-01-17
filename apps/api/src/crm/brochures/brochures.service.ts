import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, inArray, sql } from 'drizzle-orm';

export type BrochureWithAssets = schema.SelectBrochure & {
  assets: schema.SelectAsset[];
}

@Injectable()
export class BrochuresService {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) {}

  async create(data: Omit<schema.InsertBrochure, 'id'>) {
    const [{ id }] = await this.db.insert(schema.Brochure).values(data).$returningId();
    return id;
  }

  async list(tenantId: string, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    // Get total count
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Brochure)
      .where(eq(schema.Brochure.tenantId, tenantId))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    // Get paginated brochures
    const brochures = await this.db.query.Brochure.findMany({
      where: (b, { eq }) =>
        eq(b.tenantId, tenantId),
      limit: pageSize,
      offset: offset
    });

    const ids = brochures.map((b) => b.id);
    const links = ids.length
      ? await this.db.query.BrochureAsset.findMany({ where: (bp, { inArray }) => inArray(bp.brochureId, ids) })
      : [];
    const assetsByBrochure = new Map<number, string[]>();
    links.forEach((l) => {
      assetsByBrochure.set((l.brochureId), [...(assetsByBrochure.get((l.brochureId)) ?? []), l.assetId]);
    });

    // hydrate contact + assets
    const res: BrochureWithAssets[] = [];
    for (const b of brochures) {
      // const contact = await this.db.query.Contact.findFirst({ where: (c, { eq }) => eq(c.id, b.contactId) });
      const assets = await this.db.query.Asset.findMany({
        where: (a, { inArray }) => inArray(a.id, assetsByBrochure.get(b.id) ?? []),
      });
      // res.push({ ...b, contact, assets });
      res.push({ ...b, assets: assets.map(a => ({ ...a, assetTypeId: (a.assetTypeId) })) });
    }

    // Calculate pagination metadata
    const paginationData = {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };

    return {
      data: res,
      pagination: paginationData,
    };
  }

  async get(id: number) {
    const brochure = await this.db.query.Brochure.findFirst({ where: (b, { eq }) => eq(b.id, id) });
    if (!brochure) return null;

    const contactLinks = await this.db.query.BrochureContact.findMany({ where: (bp, { eq }) => eq(bp.brochureId, (id)) });
    
    const links = await this.db.query.BrochureAsset.findMany({ where: (bp, { eq }) => eq(bp.brochureId, (id)) });
    const assets = await this.db.query.Asset.findMany({
      where: (a, { inArray }) => inArray(a.id, links.map((l) => l.assetId)),
    });
    return { ...brochure, assets: assets.map(a => ({ ...a, assetTypeId: (a.assetTypeId) })) };
  }

  async remove(id: number) {
    await this.db.transaction(async (tx) => {
      await tx.delete(schema.BrochureAsset).where(eq(schema.BrochureAsset.brochureId, id));
      await tx.delete(schema.Brochure).where(eq(schema.Brochure.id, id));
    });
  }

  async addAssets(brochureId: number, assetIds: string[]) {
    if (!assetIds.length) return 0;
    await this.db.insert(schema.BrochureAsset).values(
      assetIds.map((assetId) => ({ brochureId: brochureId, assetId, tenantId: '' as any })) // tenantId set by trigger/ignored if not required in schema export
    ).onDuplicateKeyUpdate({ set: {} }).execute();
    return assetIds.length;
  }

  async removeAsset(brochureId: number, assetId: string) {
    await this.db.delete(schema.BrochureAsset).where(
      and(eq(schema.BrochureAsset.brochureId, (brochureId)), eq(schema.BrochureAsset.assetId, assetId))
    );
  }

  async listAssets(brochureId: number, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    // Get all links for this brochure
    const links = await this.db.query.BrochureAsset.findMany({ where: (bp, { eq }) => eq(bp.brochureId, (brochureId)) });
    const assetIds = links.map((l) => l.assetId);
    const totalCount = assetIds.length;

    // Get paginated assets
    const assets = assetIds.length
      ? await this.db.query.Asset.findMany({
          where: (a, { inArray }) => inArray(a.id, assetIds),
          limit: pageSize,
          offset: offset,
        })
      : [];

    // Calculate pagination metadata
    const paginationData = {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };

    return {
      data: assets.map((a) => ({ ...a })),
      pagination: paginationData,
    };
  }
}
