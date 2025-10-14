import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, gte, lte } from 'drizzle-orm';

@Injectable()
export class FeedbackService {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) {}

  async create(data: Omit<schema.InsertFeedback, 'id'>,tenantId: string) {
    // Convert viewingDate to Date object
    const viewingDate = new Date(data.viewingDate);
    if (isNaN(viewingDate.getTime())) {
      throw new Error('Invalid date format');
    }
    const [{ id }] = await this.db.insert(schema.Feedback).values({...data, contactId: BigInt(data.contactId), tenantId,viewingDate}).$returningId();
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

    const feedbackList = await this.db.query.Feedback.findMany({
      where: and(
        eq(schema.Feedback.tenantId, tenantId),
        query.contactId ? eq(schema.Feedback.contactId, BigInt(query.contactId)) : undefined,
        query.assetId ? eq(schema.Feedback.assetId, query.assetId) : undefined,
        query.minRating ? gte(schema.Feedback.rating, query.minRating) : undefined,
        query.maxRating ? lte(schema.Feedback.rating, query.maxRating) : undefined,
      ),
      
    });

    return feedbackList
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

  async update(id: number, patch: schema.UpdateFeedback) {
    // Convert viewingDate to Date object
    let viewingDate: Date | undefined;
    if (patch.viewingDate) {
       viewingDate = new Date(patch.viewingDate);
      if (isNaN(viewingDate.getTime())) {
        throw new Error('Invalid date format');
      }
    }
    await this.db.update(schema.Feedback).set({...patch, contactId: BigInt(patch.contactId),viewingDate}).where(eq(schema.Feedback.id, id)).execute();
  }

  async remove(id: number) {
    await this.db.delete(schema.Feedback).where(eq(schema.Feedback.id, id)).execute();
  }
}