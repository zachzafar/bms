import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq } from 'drizzle-orm';

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

  async create(data: Omit<schema.InsertTask, 'id'>) {
    const [{ id }] = await this.db.insert(schema.Task).values(data).$returningId();
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

  async list(tenantId: string, query: any) {
    const rows = await this.db
      .select()
      .from(schema.Task)
      .where(eq(schema.Task.tenantId, tenantId))
      .leftJoin(schema.Contact, eq(schema.Task.contactId, schema.Contact.id))
      .innerJoin(schema.User, eq(schema.Task.userId, schema.User.id))
      .execute();

    const filtered = rows.filter((r) => {
      if (query.userId && r.users.id !== query.userId) return false;
      if (query.contactId && String(r.contact?.id) !== String(query.contactId)) return false;
      if (query.status && r.task.status !== query.status) return false;
      if (query.from && r.task.dueDate < new Date(query.from)) return false;
      if (query.to && r.task.dueDate > new Date(query.to)) return false;
      return true;
    });

    return filtered.map(this.toExtended);
  }

  async get(id: number) {
    const rows = await this.db
      .select()
      .from(schema.Task)
      .where(eq(schema.Task.id, id))
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
    await this.db.delete(schema.Task).where(eq(schema.Task.id, id)).execute();
  }

  async complete(id: number) {
    await this.db.update(schema.Task).set({ status: 'Completed' as any }).where(eq(schema.Task.id, id)).execute();
  }
}
