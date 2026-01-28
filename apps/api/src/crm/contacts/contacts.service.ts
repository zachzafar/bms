import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, ilike, isNull, or, sql } from 'drizzle-orm';

@Injectable()
export class ContactsService {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) {}

  async createContact(contact: Omit<schema.InsertContact, 'id'>) {
    const [{ id }] = await this.db.insert(schema.Contact).values(contact).$returningId();
    return id;
  }

  async listContacts(tenantId: string, query: { search?: string; hasCustomer?: boolean; hasOwner?: boolean; }, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    // Get total count
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Contact)
      .where(and(eq(schema.Contact.tenantId, tenantId), isNull(schema.Contact.deletedAt)))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    // Base: contacts by tenant
    const contacts = await this.db.query.Contact.findMany({
      where: (c, { eq, and, or, like, isNull }) => and(
        eq(c.tenantId, tenantId),
        isNull(c.deletedAt),
        query.search
          ? or(
              like(c.firstName, `%${query.search}%`),
              like(c.lastName, `%${query.search}%`),
              like(c.email, `%${query.search}%`),
              like(c.phone ?? sql`''`, `%${query.search}%`)
            )
          : undefined
      ),
      limit: pageSize,
      offset: offset,
    });

    // Optional filters: hasCustomer / hasOwner
    const ids = contacts.map((c) => c.id);
    const customers = await this.db.query.Customer.findMany({
      where: (t, { inArray }) => inArray(t.contactId, ids),
    });
    const owners = await this.db.query.Owner.findMany({
      where: (t, { inArray }) => inArray(t.contactId, ids),
    });

    const customerByContact = new Map(customers.map((x) => [x.contactId, x]));
    const ownerByContact = new Map(owners.map((x) => [x.contactId, x]));

    let result = contacts.map((c) => ({
      ...c,
      customerProfile: customerByContact.get(c.id) ?? undefined,
      ownerProfile: ownerByContact.get(c.id) ?? undefined,
    }));

    if (query.hasCustomer === true) result = result.filter((r) => !!r.customerProfile);
    if (query.hasOwner === true) result = result.filter((r) => !!r.ownerProfile);

    const paginationData = {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };

    return {
      data: result,
      pagination: paginationData,
    };
  }

  async getContact(id: number) {
    const contact = await this.db.query.Contact.findFirst({ where: (c, { eq, and, isNull }) => and(eq(c.id, id), isNull(c.deletedAt)) });
    if (!contact) return null;
    const customer = await this.db.query.Customer.findFirst({ where: (t, { eq }) => eq(t.contactId, id) });
    const owner = await this.db.query.Owner.findFirst({ where: (t, { eq }) => eq(t.contactId, id) });
    return { ...contact, customerProfile: customer ?? undefined, ownerProfile: owner ?? undefined };
    }

  async updateContact(id: number, patch: Partial<schema.UpdateContact>) {
    await this.db.update(schema.Contact).set(patch).where(eq(schema.Contact.id, id)).execute();
  }

  async deleteContact(id: number) {
    await this.db
      .update(schema.Contact)
      .set({ deletedAt: new Date() })
      .where(eq(schema.Contact.id, id))
      .execute();
  }

  // async mergeContacts(tenantId: string, { targetId, sourceId }: { targetId: number; sourceId: number }) {
  //   if (targetId === sourceId) return;

  //   // Repoint children from source -> target (relying on tenant cascades for safety)
  //   await this.db.update(schema.Inquiry).set({ contactId: (targetId) }).where(eq(schema.Inquiry.contactId, (sourceId)));
  //   await this.db.update(schema.CommunicationLog).set({ contactId: (targetId) }).where(eq(schema.CommunicationLog.contactId, (sourceId)));
  //   await this.db.update(schema.Feedback).set({ contactId: (targetId) }).where(eq(schema.Feedback.contactId, (sourceId)));
  //   await this.db.update(schema.Document).set({ contactId: (targetId) }).where(eq(schema.Document.contactId, (sourceId)));
  //   await this.db.update(schema.Brochure).set({ contactId: (targetId) }).where(eq(schema.Brochure.contactId, (sourceId)));
  //   await this.db.update(schema.Task).set({ contactId: (targetId) }).where(eq(schema.Task.contactId, (sourceId)));

  //   // Profiles: move if target lacks one
  //   const sourceCustomer = await this.db.query.Customer.findFirst({ where: (t, { eq }) => eq(t.contactId, (sourceId)) });
  //   const targetCustomer = await this.db.query.Customer.findFirst({ where: (t, { eq }) => eq(t.contactId, (targetId)) });
  //   if (sourceCustomer && !targetCustomer) {
  //     await this.db.update(schema.Customer).set({ contactId: (targetId) }).where(eq(schema.Customer.contactId, (sourceId)));
  //   } else if (sourceCustomer && targetCustomer) {
  //     // both exist -> delete source profile
  //     await this.db.delete(schema.Customer).where(eq(schema.Customer.contactId, (sourceId)));
  //   }

  //   const sourceOwner = await this.db.query.Owner.findFirst({ where: (t, { eq }) => eq(t.contactId, (sourceId)) });
  //   const targetOwner = await this.db.query.Owner.findFirst({ where: (t, { eq }) => eq(t.contactId, (targetId)) });
  //   if (sourceOwner && !targetOwner) {
  //     await this.db.update(schema.Owner).set({ contactId: (targetId) }).where(eq(schema.Owner.contactId, (sourceId)));
  //   } else if (sourceOwner && targetOwner) {
  //     await this.db.delete(schema.Owner).where(eq(schema.Owner.contactId, (sourceId)));
  //   }

  //   // Remove source contact
  //   await this.db.delete(schema.Contact).where(eq(schema.Contact.id, sourceId));
  // }

  // async attachUser(contactId: number, userId: string) {
  //   await this.db.update(schema.Contact).set({ userId }).where(eq(schema.Contact.id, contactId));
  // }

  // async detachUser(contactId: number) {
  //   await this.db.update(schema.Contact).set({ userId: null as any }).where(eq(schema.Contact.id, contactId));
  // }
}
