import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, between, eq, gte, isNull, lte, sql } from 'drizzle-orm';

@Injectable()
export class CommunicationsService {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) {}

  async create(data: Omit<schema.InsertCommunicationLog, 'id'>) {
     const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('invalid date format');
      }
    const [{ id }] = await this.db.insert(schema.CommunicationLog).values({...data, date}).$returningId();
    return id;
  }

  private toExtended(row: any) {
    return {
      ...row.communication_log,
      date: row.communication_log.date.toISOString(),
      contact: row.contact,
      user: row.users,
    };
  }

  async list(tenantId: string, query: any, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    // Get total count
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.CommunicationLog)
      .where(and(eq(schema.CommunicationLog.tenantId, tenantId), isNull(schema.CommunicationLog.deletedAt)))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    const comms = await this.db.query.CommunicationLog.findMany({
      where: and(
        eq(schema.CommunicationLog.tenantId, tenantId),
        isNull(schema.CommunicationLog.deletedAt),
        query.contactId ? eq(schema.CommunicationLog.contactId, (query.contactId)) : undefined,
        query.userId ? eq(schema.CommunicationLog.userId, query.userId) : undefined,
        query.type ? eq(schema.CommunicationLog.type, query.type) : undefined,
        query.from ? gte(schema.CommunicationLog.date, new Date(query.from)) : undefined,
        query.to ? lte(schema.CommunicationLog.date, new Date(query.to)) : undefined,
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
      data: comms,
      pagination: paginationData,
    };
  }

  async get(id: number) {
    const rows = await this.db
      .select()
      .from(schema.CommunicationLog)
      .where(and(eq(schema.CommunicationLog.id, id), isNull(schema.CommunicationLog.deletedAt)))
      .innerJoin(schema.Contact, eq(schema.CommunicationLog.contactId, schema.Contact.id))
      .innerJoin(schema.User, eq(schema.CommunicationLog.userId, schema.User.id))
      .execute();

    if (!rows.length) return null;
    return this.toExtended(rows[0]);
  }

  async update(id: number, patch: schema.UpdateCommunicationLog) {
    let date:Date | undefined = undefined
    if (patch.date) {
       date = new Date(patch.date);
      if (isNaN(date.getTime())) {
        return { status: 400, body: { message: 'invalid date format' } };
      }
    }
    await this.db.update(schema.CommunicationLog).set({...patch, date}).where(eq(schema.CommunicationLog.id, id)).execute();
  }

  async remove(id: number) {
    await this.db
      .update(schema.CommunicationLog)
      .set({ deletedAt: new Date() })
      .where(eq(schema.CommunicationLog.id, id))
      .execute();
  }
}
