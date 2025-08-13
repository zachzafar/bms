import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class FeedbackService {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) {}

  async create(data: Omit<schema.InsertFeedback, 'id'>) {
    const [{ id }] = await this.db.insert(schema.Feedback).values(data).$returningId();
    return id;
  }

  private toExtended(row: any) {
    return {
      ...row.feedback,
      viewingDate: row.feedback.viewingDate.toISOString(),
      contact: row.contact,
      asset: row.assets,
    };
  }

  async list(tenantId: string, query: any) {
    const rows = await this.db
      .select()
      .from(schema.Feedback)
      .where(eq(schema.Feedback.tenantId, tenantId))
      .innerJoin(schema.Contact, eq(schema.Feedback.contactId, schema.Contact.id))
      .innerJoin(schema.Asset, eq(schema.Feedback.assetId, schema.Asset.id))
      .execute();

    const filtered = rows.filter((r) => {
      if (query.contactId && String(r.contact.id) !== String(query.contactId)) return false;
      if (query.assetId && r.assets.id !== query.assetId) return false;
      if (query.minRating && r.feedback.rating < query.minRating) return false;
      if (query.maxRating && r.feedback.rating > query.maxRating) return false;
      return true;
    });

    return filtered.map(this.toExtended);
  }

  async get(id: number) {
    const rows = await this.db
      .select()
      .from(schema.Feedback)
      .where(eq(schema.Feedback.id, id))
      .innerJoin(schema.Contact, eq(schema.Feedback.contactId, schema.Contact.id))
      .innerJoin(schema.Asset, eq(schema.Feedback.assetId, schema.Asset.id))
      .execute();

    if (!rows.length) return null;
    return this.toExtended(rows[0]);
  }

  async update(id: number, patch: Partial<schema.UpdateFeedback>) {
    await this.db.update(schema.Feedback).set(patch).where(eq(schema.Feedback.id, id)).execute();
  }

  async remove(id: number) {
    await this.db.delete(schema.Feedback).where(eq(schema.Feedback.id, id)).execute();
  }
}
