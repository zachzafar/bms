import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, gte, lte, sql } from 'drizzle-orm';

@Injectable()
export class FeedbackService {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) {}

  async create(data: Omit<schema.InsertFeedback, 'id'>,tenantId: string) {
    // Convert viewingDate to Date object
    const viewingDate = new Date(data.viewingDate);
    if (isNaN(viewingDate.getTime())) {
      throw new Error('Invalid date format');
    }
    const [{ id }] = await this.db.insert(schema.Feedback).values({...data, contactId: data.contactId, tenantId,viewingDate}).$returningId();
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

  async list(tenantId: string, query: any, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    // Get total count
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Feedback)
      .where(eq(schema.Feedback.tenantId, tenantId))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    const feedbackList = await this.db.query.Feedback.findMany({
      where: and(
        eq(schema.Feedback.tenantId, tenantId),
        query.contactId ? eq(schema.Feedback.contactId, query.contactId) : undefined,
        query.assetId ? eq(schema.Feedback.assetId, query.assetId) : undefined,
        query.minRating ? gte(schema.Feedback.rating, query.minRating) : undefined,
        query.maxRating ? lte(schema.Feedback.rating, query.maxRating) : undefined,
      ),
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
      data: feedbackList,
      pagination: paginationData,
    };
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
    await this.db.update(schema.Feedback).set({...patch, contactId: patch.contactId,viewingDate}).where(eq(schema.Feedback.id, id)).execute();
  }

  async remove(id: number) {
    await this.db.delete(schema.Feedback).where(eq(schema.Feedback.id, id)).execute();
  }
}