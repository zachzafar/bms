import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, sql, inArray } from 'drizzle-orm';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { InsertAddonItem, UpdateAddonItem } from '@repo/api-contract';

@Injectable()
export class AddonService {
  private logger = new Logger(AddonService.name);
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) {}

  async createAddon(data: InsertAddonItem, tenantId: string): Promise<number> {
    this.logger.log(`Creating addon "${data.name}" for tenant ${tenantId}`);
    const [result] = await this.db
      .insert(schema.AddonItem)
      .values({ ...data, tenantId })
      .$returningId();
    return result.id;
  }

  async getAddons(tenantId: string, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(schema.AddonItem)
        .where(eq(schema.AddonItem.tenantId, tenantId))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.AddonItem)
        .where(eq(schema.AddonItem.tenantId, tenantId)),
    ]);

    const totalCount = Number(countResult[0]?.count ?? 0);

    return {
      data,
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

  async getAddon(id: number, tenantId: string) {
    const addon = await this.db.query.AddonItem.findFirst({
      where: (a, { eq: e, and: a2 }) => a2(e(a.id, id), e(a.tenantId, tenantId)),
    });
    if (!addon) throw new NotFoundException('Add-on not found');
    return addon;
  }

  async updateAddon(id: number, data: UpdateAddonItem, tenantId: string) {
    this.logger.log(`Updating addon ${id} for tenant ${tenantId}`);
    await this.db
      .update(schema.AddonItem)
      .set(data)
      .where(and(eq(schema.AddonItem.id, id), eq(schema.AddonItem.tenantId, tenantId)));
  }

  async deleteAddon(id: number, tenantId: string) {
    this.logger.log(`Deleting addon ${id} for tenant ${tenantId}`);
    await this.db
      .delete(schema.AddonItem)
      .where(and(eq(schema.AddonItem.id, id), eq(schema.AddonItem.tenantId, tenantId)));
  }

  async getAddonsBySubdomain(subdomain: string) {
    const tenantId = await this.resolveTenantBySubdomain(subdomain);
    return this.db
      .select()
      .from(schema.AddonItem)
      .where(and(eq(schema.AddonItem.tenantId, tenantId), eq(schema.AddonItem.isActive, true)));
  }

  async getAddonItemsByIds(ids: number[], tenantId: string) {
    if (ids.length === 0) return [];
    return this.db
      .select()
      .from(schema.AddonItem)
      .where(and(
        inArray(schema.AddonItem.id, ids),
        eq(schema.AddonItem.tenantId, tenantId),
        eq(schema.AddonItem.isActive, true),
      ));
  }

  private async resolveTenantBySubdomain(subdomain: string): Promise<string> {
    const tenant = await this.db.query.Tenant.findFirst({
      where: (t, { eq }) => eq(t.subdomain, subdomain),
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant.id;
  }
}
