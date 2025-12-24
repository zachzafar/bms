import { relations, sql } from "drizzle-orm";
import { bigint, datetime, decimal, index, int, mysqlTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { Tenant } from "../tenant";
import { Customer } from "../users";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";



// Invoice Model
export const Invoice = mysqlTable("invoice", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
  invoiceNumber: varchar("invoice_number", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).notNull(),
  issueDate: datetime("issue_date").notNull(),
  dueDate: datetime("due_date").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
  customerId:bigint("customer_id", { mode: 'bigint', unsigned: true }).notNull().references(() => Customer.id),
  bookingId: varchar("booking_id", { length: 255 }).notNull(),
}, (table) => ({
  invoiceNumberUniqueIdx: uniqueIndex("invoice_number_unique").on(table.invoiceNumber),
  customerIdx: index("customer_idx").on(table.customerId),
  bookingIdx: index("booking_idx").on(table.bookingId),
}));

export const SelectInvoiceSchema = createSelectSchema(Invoice).omit({ tenantId: true, dueDate: true }).extend({
  dueDate: z.string(),
});
export const InsertInvoiceSchema = createInsertSchema(Invoice).omit({ tenantId: true });
export const UpdateInvoiceSchema = InsertInvoiceSchema.partial();

export type InsertInvoice = z.infer<typeof InsertInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>;
export type SelectInvoice = z.infer<typeof SelectInvoiceSchema>;


export const InvoiceRelations = relations(Invoice, ({ one, many }) => ({
  tenant: one(Tenant, {
    fields: [Invoice.tenantId],
    references: [Tenant.id],
  }),
  customer: one(Customer, {
    fields: [Invoice.customerId],
    references: [Customer.id],
  }),
  items: many(InvoiceItem),
  payments: many(PaymentInvoice),
}));



// InvoiceItem Model
export const InvoiceItem = mysqlTable("invoice_item", {
  id: serial("id").primaryKey(),
  description: varchar("description", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
  invoiceId: bigint("invoice_id", { mode: 'bigint', unsigned: true }).notNull().references(() => Invoice.id)
}, (table) => ({
  invoiceIdx: index("invoice_idx").on(table.invoiceId),
}));

export const SelectInvoiceItemSchema = createSelectSchema(InvoiceItem);
export const InsertInvoiceItemSchema = createInsertSchema(InvoiceItem);
export const UpdateInvoiceItemSchema = InsertInvoiceItemSchema.partial();

export type InsertInvoiceItem = z.infer<typeof InsertInvoiceItemSchema>;
export type UpdateInvoiceItem = z.infer<typeof UpdateInvoiceItemSchema>;
export type SelectInvoiceItem = z.infer<typeof SelectInvoiceItemSchema>;

export const InvoiceItemRelations = relations(InvoiceItem, ({ one }) => ({
  invoice: one(Invoice, {
    fields: [InvoiceItem.invoiceId],
    references: [Invoice.id],
  }),
}));

export const PaymentInvoice = mysqlTable("payment_invoice", {
  id: serial("id").primaryKey(),
  paymentId: bigint("payment_id", { mode: 'bigint', unsigned: true }).notNull().references(() => Payment.id),
  invoiceId: bigint("invoice_id", { mode: 'bigint', unsigned: true }).notNull().references(() => Invoice.id),
  amountApplied: decimal("amount_applied", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
});

export const SelectPaymentInvoiceSchema = createSelectSchema(PaymentInvoice);
export const InsertPaymentInvoiceSchema = createInsertSchema(PaymentInvoice);
export const UpdatePaymentInvoiceSchema = InsertPaymentInvoiceSchema.partial();

export type InsertPaymentInvoice = z.infer<typeof InsertPaymentInvoiceSchema>;
export type UpdatePaymentInvoice = z.infer<typeof UpdatePaymentInvoiceSchema>;
export type SelectPaymentInvoice = z.infer<typeof SelectPaymentInvoiceSchema>;

export const PaymentInvoiceRelations = relations(PaymentInvoice, ({ one }) => ({
  payment: one(Payment, {
    fields: [PaymentInvoice.paymentId],
    references: [Payment.id],
  }),
  invoice: one(Invoice, {
    fields: [PaymentInvoice.invoiceId],
    references: [Invoice.id],
  }),
}))



// Payment Model
export const Payment = mysqlTable("payment", {
  id: serial("id").primaryKey(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).notNull(),
  paymentDate: datetime("payment_date").notNull(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
  // NEW: align with frontend usage
  paymentMethod: varchar("payment_method", { length: 64 }).notNull(),
  reference: varchar("reference", { length: 255 }),
  notes: text("notes"),

  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
  customerId: bigint("customer_id", { mode: 'bigint', unsigned: true }).notNull().references(() => Customer.id),

}, (table) => ({
  customerIdx: index("customer_idx").on(table.customerId),
  tenantIdx: index("tenant_idx").on(table.tenantId),
  // Optionally: index("payment_date_idx").on(table.paymentDate),
}));

export const SelectPaymentSchema = createSelectSchema(Payment).extend({
  paymentDate: z.string(),
  customerId: z.number(),
});
export const InsertPaymentSchema = createInsertSchema(Payment).extend({
  customerId: z.number(),
  paymentDate: z.string(),
});
export const UpdatePaymentSchema = InsertPaymentSchema.partial();

export type InsertPayment = z.infer<typeof InsertPaymentSchema>;
export type UpdatePayment = z.infer<typeof UpdatePaymentSchema>;
export type SelectPayment = z.infer<typeof SelectPaymentSchema>;

export const PaymentRelations = relations(Payment, ({ one }) => ({
  customer: one(Customer, {
    fields: [Payment.customerId],
    references: [Customer.id],
  }),
}))

// // Receipt Model
// export const Receipt = mysqlTable("receipt", {
//     id: serial("id").primaryKey(),
//     receiptNumber: varchar("receipt_number", { length: 255 }).notNull(),
//     issueDate: datetime("issue_date").notNull(),
//     totalAmount: decimal({ precision: 1 }).notNull(),
//     notes: text("notes"),
//     createdAt: timestamp('createdAt').notNull().defaultNow(),
//     updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),,
//     invoiceId: varchar("invoice_id", { length: 255 }).notNull(),
//     paymentId: varchar("payment_id", { length: 255 }).notNull(),
// }, (table) => ({
//     receiptNumberUniqueIdx: uniqueIndex("receipt_number_unique").on(table.receiptNumber),
//     invoiceIdx: index("invoice_idx").on(table.invoiceId),
//     paymentIdx: index("payment_idx").on(table.paymentId),
// }));