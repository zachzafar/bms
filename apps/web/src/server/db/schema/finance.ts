import { relations, sql } from "drizzle-orm";
import { datetime, decimal, index, int, mysqlTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { Customer, Booking } from ".";



// Invoice Model
export const Invoice = mysqlTable("invoice", {
    id: serial("id").primaryKey(),
    invoiceNumber: varchar("invoice_number", { length: 255 }).notNull(),
    status: varchar("status", { length: 255 }).notNull(),
    issueDate: datetime("issue_date").notNull(),
    dueDate: datetime("due_date").notNull(),
    subtotal: decimal({ precision: 10, scale: 2 }).notNull(),
    taxAmount: decimal({ precision: 10, scale: 2 }).notNull(),
    totalAmount: decimal({ precision: 10, scale: 2 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
    customerId: varchar("customer_id", { length: 255 }).notNull(),
    bookingId: varchar("booking_id", { length: 255 }).notNull(),
  }, (table) => ({
    invoiceNumberUniqueIdx: uniqueIndex("invoice_number_unique").on(table.invoiceNumber),
    customerIdx: index("customer_idx").on(table.customerId),
    bookingIdx: index("booking_idx").on(table.bookingId),
  }));
  
  export const InvoiceRelations = relations(Invoice, ({ one, many }) => ({
    customer: one(Customer, { fields: [Invoice.customerId], references: [Customer.id] }),
    booking: one(Booking, { fields: [Invoice.bookingId], references: [Booking.id] }),
    payments: many(Payment),
    receipts: many(Receipt),
    invoiceItems: many(InvoiceItem),
  }));
  
  export const selectInvoiceSchema = createSelectSchema(Invoice);
  export const insertInvoiceSchema = createInsertSchema(Invoice).omit({ id: true, createdAt: true, updatedAt: true });
  
  // InvoiceItem Model
  export const InvoiceItem = mysqlTable("invoice_item", {
    id: serial("id").primaryKey(),
    description: varchar("description", { length: 255 }).notNull(),
    quantity: int("quantity").notNull(),
    unitPrice: decimal({ precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal({ precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
    invoiceId: varchar("invoice_id", { length: 255 }).notNull(),
  }, (table) => ({
    invoiceIdx: index("invoice_idx").on(table.invoiceId),
  }));
  
  export const InvoiceItemRelations = relations(InvoiceItem, ({ one }) => ({
    invoice: one(Invoice, { fields: [InvoiceItem.invoiceId], references: [Invoice.id] }),
  }));
  
  export const selectInvoiceItemSchema = createSelectSchema(InvoiceItem);
  export const insertInvoiceItemSchema = createInsertSchema(InvoiceItem).omit({ id: true, createdAt: true, updatedAt: true });
  
  // Receipt Model
  export const Receipt = mysqlTable("receipt", {
    id: serial("id").primaryKey(),
    receiptNumber: varchar("receipt_number", { length: 255 }).notNull(),
    issueDate: datetime("issue_date").notNull(),
    totalAmount: decimal({ precision: 10, scale: 2 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
    invoiceId: varchar("invoice_id", { length: 255 }).notNull(),
    paymentId: varchar("payment_id", { length: 255 }).notNull(),
  }, (table) => ({
    receiptNumberUniqueIdx: uniqueIndex("receipt_number_unique").on(table.receiptNumber),
    invoiceIdx: index("invoice_idx").on(table.invoiceId),
    paymentIdx: index("payment_idx").on(table.paymentId),
  }));
  
  export const ReceiptRelations = relations(Receipt, ({ one }) => ({
    invoice: one(Invoice, { fields: [Receipt.invoiceId], references: [Invoice.id] }),
    payment: one(Payment, { fields: [Receipt.paymentId], references: [Payment.id] }),
  }));
  
  export const selectReceiptSchema = createSelectSchema(Receipt);
  export const insertReceiptSchema = createInsertSchema(Receipt).omit({ id: true, createdAt: true, updatedAt: true });
  
  // Payment Model
  export const Payment = mysqlTable("payment", {
    id: serial("id").primaryKey(),
    amount: decimal({ precision: 10, scale: 2 }).notNull(),
    type: varchar("type", { length: 255 }).notNull(),
    status: varchar("status", { length: 255 }).notNull(),
    paymentDate: datetime("payment_date").notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
    bookingId: varchar("booking_id", { length: 255 }).notNull(),
    customerId: varchar("customer_id", { length: 255 }).notNull(),
    invoiceId: varchar("invoice_id", { length: 255 }),
  }, (table) => ({
    bookingIdx: index("booking_idx").on(table.bookingId),
    customerIdx: index("customer_idx").on(table.customerId),
    invoiceIdx: index("invoice_idx").on(table.invoiceId),
  }));
  
  export const PaymentRelations = relations(Payment, ({ one }) => ({
    booking: one(Booking, { fields: [Payment.bookingId], references: [Booking.id] }),
    customer: one(Customer, { fields: [Payment.customerId], references: [Customer.id] }),
    invoice: one(Invoice, { fields: [Payment.invoiceId], references: [Invoice.id] }),
    receipt: one(Receipt, { fields: [Payment.id], references: [Receipt.paymentId] }),
  }));
  
  export const selectPaymentSchema = createSelectSchema(Payment);
  export const insertPaymentSchema = createInsertSchema(Payment).omit({ id: true, createdAt: true, updatedAt: true });
  
  