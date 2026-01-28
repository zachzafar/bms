import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, isNull, sql } from 'drizzle-orm';

@Injectable()
export class TasksService {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) {}

  async assertUserInTenant(tenantId: string, userId: string) {
    // If you store tenant memberships in tenant_has_users, enforce here:
    const member = await this.db.query.TenantHasUsers.findFirst({
      where: (t, { and, eq }) => and(eq(t.tenantId, tenantId), eq(t.userId, userId)),
    });
    if (!member) throw new NotFoundException('User not in tenant');
  }

  async create(data: Omit<schema.InsertTask, 'id'>,tenantId: string) {
    const [{ id }] = await this.db.insert(schema.Task).values({...data,tenantId}).$returningId();
    return id;
  }

  private toExtended(row: any) {
    return {
      ...row.task,
      dueDate: row.task.dueDate.toISOString(),
      assignee: row.users,
      contact: row.contact ?? undefined,
    };
  }

  async list(tenantId: string, query: any, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    // Build where conditions
    const conditions = [eq(schema.Task.tenantId, tenantId), isNull(schema.Task.deletedAt)];
    if (query.userId) conditions.push(eq(schema.Task.userId, query.userId));
    if (query.contactId) conditions.push(eq(schema.Task.contactId, Number(query.contactId)));
    if (query.status) conditions.push(eq(schema.Task.status, query.status));

    // Get total count
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Task)
      .where(and(...conditions))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    // Get paginated tasks
    const tasksList = await this.db.query.Task.findMany({
      where: () => and(...conditions),
      limit: pageSize,
      offset: offset,
    });

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
      data: tasksList,
      pagination: paginationData,
    };
  }

  async get(id: number) {
    const rows = await this.db
      .select()
      .from(schema.Task)
      .where(and(eq(schema.Task.id, id), isNull(schema.Task.deletedAt)))
      .leftJoin(schema.Contact, eq(schema.Task.contactId, schema.Contact.id))
      .innerJoin(schema.User, eq(schema.Task.userId, schema.User.id))
      .execute();
    if (!rows.length) return null;
    return this.toExtended(rows[0]);
  }

  async update(id: number, patch: Partial<schema.UpdateTask>) {
    await this.db.update(schema.Task).set(patch).where(eq(schema.Task.id, id)).execute();
  }

  async remove(id: number) {
    await this.db
      .update(schema.Task)
      .set({ deletedAt: new Date() })
      .where(eq(schema.Task.id, id))
      .execute();
  }

  async complete(id: number) {
    await this.db.update(schema.Task).set({ status: 'Completed' as any }).where(eq(schema.Task.id, id)).execute();
  }
}
