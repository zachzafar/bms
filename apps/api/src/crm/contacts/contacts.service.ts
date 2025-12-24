import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from 'src/database-schema';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, ilike, or, sql } from 'drizzle-orm';

@Injectable()
export class ContactsService {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) {}

  async createContact(contact: Omit<schema.InsertContact, 'id'>) {
    const [{ id }] = await this.db.insert(schema.Contact).values(contact).$returningId();
    return id;
  }

  async listContacts(tenantId: string, query: { search?: string; hasCustomer?: boolean; hasOwner?: boolean; }) {
    // Base: contacts by tenant
    const contacts = await this.db.query.Contact.findMany({
      where: (c, { eq, and, or, like }) => and(
        eq(c.tenantId, tenantId),
        query.search
          ? or(
              like(c.firstName, `%${query.search}%`),
              like(c.lastName, `%${query.search}%`),
              like(c.email, `%${query.search}%`),
              like(c.phone ?? sql`''`, `%${query.search}%`)
            )
          : undefined
      ),
    });

    // Optional filters: hasCustomer / hasOwner
    const ids = contacts.map((c) => BigInt(c.id));
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
      customerProfile: customerByContact.get(BigInt(c.id)) ?? undefined,
      ownerProfile: ownerByContact.get(BigInt(c.id)) ?? undefined,
    }));

    if (query.hasCustomer === true) result = result.filter((r) => !!r.customerProfile);
    if (query.hasOwner === true) result = result.filter((r) => !!r.ownerProfile);

    return result;
  }

  async getContact(id: number) {
    const contact = await this.db.query.Contact.findFirst({ where: (c, { eq }) => eq(c.id, id) });
    if (!contact) return null;
    const customer = await this.db.query.Customer.findFirst({ where: (t, { eq }) => eq(t.contactId, BigInt(id)) });
    const owner = await this.db.query.Owner.findFirst({ where: (t, { eq }) => eq(t.contactId, BigInt(id)) });
    return { ...contact, customerProfile: customer ?? undefined, ownerProfile: owner ?? undefined };
    }

  async updateContact(id: number, patch: Partial<schema.UpdateContact>) {
    await this.db.update(schema.Contact).set(patch).where(eq(schema.Contact.id, id)).execute();
  }

  async deleteContact(id: number) {
    await this.db.delete(schema.Contact).where(eq(schema.Contact.id, id)).execute();
  }

  // async mergeContacts(tenantId: string, { targetId, sourceId }: { targetId: number; sourceId: number }) {
  //   if (targetId === sourceId) return;

  //   // Repoint children from source -> target (relying on tenant cascades for safety)
  //   await this.db.update(schema.Inquiry).set({ contactId: BigInt(targetId) }).where(eq(schema.Inquiry.contactId, BigInt(sourceId)));
  //   await this.db.update(schema.CommunicationLog).set({ contactId: BigInt(targetId) }).where(eq(schema.CommunicationLog.contactId, BigInt(sourceId)));
  //   await this.db.update(schema.Feedback).set({ contactId: BigInt(targetId) }).where(eq(schema.Feedback.contactId, BigInt(sourceId)));
  //   await this.db.update(schema.Document).set({ contactId: BigInt(targetId) }).where(eq(schema.Document.contactId, BigInt(sourceId)));
  //   await this.db.update(schema.Brochure).set({ contactId: BigInt(targetId) }).where(eq(schema.Brochure.contactId, BigInt(sourceId)));
  //   await this.db.update(schema.Task).set({ contactId: BigInt(targetId) }).where(eq(schema.Task.contactId, BigInt(sourceId)));

  //   // Profiles: move if target lacks one
  //   const sourceCustomer = await this.db.query.Customer.findFirst({ where: (t, { eq }) => eq(t.contactId, BigInt(sourceId)) });
  //   const targetCustomer = await this.db.query.Customer.findFirst({ where: (t, { eq }) => eq(t.contactId, BigInt(targetId)) });
  //   if (sourceCustomer && !targetCustomer) {
  //     await this.db.update(schema.Customer).set({ contactId: BigInt(targetId) }).where(eq(schema.Customer.contactId, BigInt(sourceId)));
  //   } else if (sourceCustomer && targetCustomer) {
  //     // both exist -> delete source profile
  //     await this.db.delete(schema.Customer).where(eq(schema.Customer.contactId, BigInt(sourceId)));
  //   }

  //   const sourceOwner = await this.db.query.Owner.findFirst({ where: (t, { eq }) => eq(t.contactId, BigInt(sourceId)) });
  //   const targetOwner = await this.db.query.Owner.findFirst({ where: (t, { eq }) => eq(t.contactId, BigInt(targetId)) });
  //   if (sourceOwner && !targetOwner) {
  //     await this.db.update(schema.Owner).set({ contactId: BigInt(targetId) }).where(eq(schema.Owner.contactId, BigInt(sourceId)));
  //   } else if (sourceOwner && targetOwner) {
  //     await this.db.delete(schema.Owner).where(eq(schema.Owner.contactId, BigInt(sourceId)));
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
