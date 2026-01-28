import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, ilike, isNull, or, sql } from 'drizzle-orm';

@Injectable()
export class InquiriesService {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) {}

  async createInquiry(data: Omit<schema.InsertInquiry, 'id'>) {
    const [{ id }] = await this.db.insert(schema.Inquiry).values(data).$returningId();
    return id;
  }

  private toExtended(row: any) {
    return {
      ...row.inquiry,
      inquiryDate: row.inquiry.inquiryDate.toISOString(),
      followUpDate: row.inquiry.followUpDate ? row.inquiry.followUpDate.toISOString() : undefined,
      contact: row.contact,
      asset: row.assets,
      assignee: row.users,
    };
  }

  async listInquiries(tenantId: string, query: any, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    // Get total count
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Inquiry)
      .where(and(eq(schema.Inquiry.tenantId, tenantId), isNull(schema.Inquiry.deletedAt)))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    const rows = await this.db
      .select()
      .from(schema.Inquiry)
      .where(and(eq(schema.Inquiry.tenantId, tenantId), isNull(schema.Inquiry.deletedAt)))
      .innerJoin(schema.Contact, eq(schema.Inquiry.contactId, schema.Contact.id))
      .innerJoin(schema.Asset, eq(schema.Inquiry.assetId, schema.Asset.id))
      .innerJoin(schema.User, eq(schema.Inquiry.assignedTo, schema.User.id))
      .limit(pageSize)
      .offset(offset)
      .execute();

    // Cheap filters at app layer (or convert to where clauses as needed)
    const filtered = rows.filter((r) => {
      if (query.contactId && String(r.contact.id) !== String(query.contactId)) return false;
      if (query.assetId && r.assets.id !== query.assetId) return false;
      if (query.status && r.inquiry.status !== query.status) return false;
      if (query.assignedTo && r.users.id !== query.assignedTo) return false;
      if (query.search) {
        const s = query.search.toLowerCase();
        const hit =
          r.contact.firstName.toLowerCase().includes(s) ||
          r.contact.lastName.toLowerCase().includes(s) ||
          r.contact.email.toLowerCase().includes(s) ||
          (r.inquiry.notes ?? '').toLowerCase().includes(s);
        if (!hit) return false;
      }
      return true;
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
      data: filtered.map((i) => ({
        ...i,
        assets: {}
      })).map(this.toExtended),
      pagination: paginationData,
    };
  }

  async getInquiry(id: number) {
    const rows = await this.db
      .select()
      .from(schema.Inquiry)
      .where(and(eq(schema.Inquiry.id, id), isNull(schema.Inquiry.deletedAt)))
      .innerJoin(schema.Contact, eq(schema.Inquiry.contactId, schema.Contact.id))
      .innerJoin(schema.Asset, eq(schema.Inquiry.assetId, schema.Asset.id))
      .innerJoin(schema.User, eq(schema.Inquiry.assignedTo, schema.User.id))
      .execute();

    if (!rows.length) return null;
    return this.toExtended(rows[0]);
  }

  async updateInquiry(id: number, patch: Partial<schema.UpdateInquiry>) {
    await this.db.update(schema.Inquiry).set(patch).where(eq(schema.Inquiry.id, id)).execute();
  }

  async deleteInquiry(id: number) {
    await this.db
      .update(schema.Inquiry)
      .set({ deletedAt: new Date() })
      .where(eq(schema.Inquiry.id, id));
  }

  async assignInquiry(id: number, userId: string) {
    await this.db.update(schema.Inquiry).set({ assignedTo: userId }).where(eq(schema.Inquiry.id, id));
  }
}
