import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from 'src/database-schema';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, inArray } from 'drizzle-orm';

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

  async list(tenantId: string) {
    const brochures = await this.db.query.Brochure.findMany({
      where: (b, { eq }) => 
        eq(b.tenantId, tenantId)
    });

    const ids = brochures.map((b) => BigInt(b.id));
    const links = ids.length
      ? await this.db.query.BrochureAsset.findMany({ where: (bp, { inArray }) => inArray(bp.brochureId, ids) })
      : [];
    const assetsByBrochure = new Map<number, string[]>();
    links.forEach((l) => {
      assetsByBrochure.set(Number(l.brochureId), [...(assetsByBrochure.get(Number(l.brochureId)) ?? []), l.assetId]);
    });

    // hydrate contact + assets
    const res: BrochureWithAssets[] = [];
    for (const b of brochures) {
      // const contact = await this.db.query.Contact.findFirst({ where: (c, { eq }) => eq(c.id, b.contactId) });
      const assets = await this.db.query.Asset.findMany({
        where: (a, { inArray }) => inArray(a.id, assetsByBrochure.get(b.id) ?? []),
      });
      // res.push({ ...b, contact, assets });
      res.push({ ...b, assets: assets.map(a => ({ ...a, assetTypeId: Number(a.assetTypeId) })) });
    }
    return res;
  }

  async get(id: number) {
    const brochure = await this.db.query.Brochure.findFirst({ where: (b, { eq }) => eq(b.id, id) });
    if (!brochure) return null;

    const contactLinks = await this.db.query.BrochureContact.findMany({ where: (bp, { eq }) => eq(bp.brochureId, BigInt(id)) });
    
    const links = await this.db.query.BrochureAsset.findMany({ where: (bp, { eq }) => eq(bp.brochureId, BigInt(id)) });
    const assets = await this.db.query.Asset.findMany({
      where: (a, { inArray }) => inArray(a.id, links.map((l) => l.assetId)),
    });
    return { ...brochure, assets: assets.map(a => ({ ...a, assetTypeId: Number(a.assetTypeId) })) };
  }

  async remove(id: number) {
    await this.db.transaction(async (tx) => {
      await tx.delete(schema.BrochureAsset).where(eq(schema.BrochureAsset.brochureId, BigInt(id)));
      await tx.delete(schema.Brochure).where(eq(schema.Brochure.id, id));
    });
  }

  async addAssets(brochureId: number, assetIds: string[]) {
    if (!assetIds.length) return 0;
    await this.db.insert(schema.BrochureAsset).values(
      assetIds.map((assetId) => ({ brochureId: BigInt(brochureId), assetId, tenantId: '' as any })) // tenantId set by trigger/ignored if not required in schema export
    ).onDuplicateKeyUpdate({ set: {} }).execute();
    return assetIds.length;
  }

  async removeAsset(brochureId: number, assetId: string) {
    await this.db.delete(schema.BrochureAsset).where(
      and(eq(schema.BrochureAsset.brochureId, BigInt(brochureId)), eq(schema.BrochureAsset.assetId, assetId))
    );
  }

  async listAssets(brochureId: number) {
    const links = await this.db.query.BrochureAsset.findMany({ where: (bp, { eq }) => eq(bp.brochureId, BigInt(brochureId)) });
    const assets = await this.db.query.Asset.findMany({
      where: (a, { inArray }) => inArray(a.id, links.map((l) => l.assetId)),
    });
    return assets.map((a) => ({ ...a }));
  }
}
