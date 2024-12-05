// import { sql } from "drizzle-orm";
// import { datetime, decimal, index, int, mysqlTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";



// // Invoice Model
// export const Invoice = mysqlTable("invoice", {
//     id: serial("id").primaryKey(),
//     invoiceNumber: varchar("invoice_number", { length: 255 }).notNull(),
//     status: varchar("status", { length: 255 }).notNull(),
//     issueDate: datetime("issue_date").notNull(),
//     dueDate: datetime("due_date").notNull(),
//     subtotal: decimal({ precision: 1 }).notNull(),
//     taxAmount: decimal({ precision: 1 }).notNull(),
//     totalAmount: decimal({ precision: 1 }).notNull(),
//     notes: text("notes"),
//     createdAt: timestamp('createdAt').notNull().defaultNow(),
//     updatedAt: timestamp('updatedAt', { mode: 'string' }),
//     customerId: varchar("customer_id", { length: 255 }).notNull(),
//     bookingId: varchar("booking_id", { length: 255 }).notNull(),
// }, (table) => ({
//     invoiceNumberUniqueIdx: uniqueIndex("invoice_number_unique").on(table.invoiceNumber),
//     customerIdx: index("customer_idx").on(table.customerId),
//     bookingIdx: index("booking_idx").on(table.bookingId),
// }));

// // InvoiceItem Model
// export const InvoiceItem = mysqlTable("invoice_item", {
//     id: serial("id").primaryKey(),
//     description: varchar("description", { length: 255 }).notNull(),
//     quantity: int("quantity").notNull(),
//     unitPrice: decimal({ precision: 1 }).notNull(),
//     totalPrice: decimal({ precision: 1 }).notNull(),
//     createdAt: timestamp('createdAt').notNull().defaultNow(),
//     updatedAt: timestamp('updatedAt', { mode: 'string' }),
//     invoiceId: varchar("invoice_id", { length: 255 }).notNull(),
// }, (table) => ({
//     invoiceIdx: index("invoice_idx").on(table.invoiceId),
// }));

// // Receipt Model
// export const Receipt = mysqlTable("receipt", {
//     id: serial("id").primaryKey(),
//     receiptNumber: varchar("receipt_number", { length: 255 }).notNull(),
//     issueDate: datetime("issue_date").notNull(),
//     totalAmount: decimal({ precision: 1 }).notNull(),
//     notes: text("notes"),
//     createdAt: timestamp('createdAt').notNull().defaultNow(),
//     updatedAt: timestamp('updatedAt', { mode: 'string' }),
//     invoiceId: varchar("invoice_id", { length: 255 }).notNull(),
//     paymentId: varchar("payment_id", { length: 255 }).notNull(),
// }, (table) => ({
//     receiptNumberUniqueIdx: uniqueIndex("receipt_number_unique").on(table.receiptNumber),
//     invoiceIdx: index("invoice_idx").on(table.invoiceId),
//     paymentIdx: index("payment_idx").on(table.paymentId),
// }));

// // Payment Model
// export const Payment = mysqlTable("payment", {
//     id: serial("id").primaryKey(),
//     amount: decimal().notNull(),
//     type: varchar("type", { length: 255 }).notNull(),
//     status: varchar("status", { length: 255 }).notNull(),
//     paymentDate: datetime("payment_date").notNull(),
//     createdAt: timestamp('createdAt').notNull().defaultNow(),
//     updatedAt: timestamp('updatedAt', { mode: 'string' }),
//     bookingId: varchar("booking_id", { length: 255 }).notNull(),
//     customerId: varchar("customer_id", { length: 255 }).notNull(),
//     invoiceId: varchar("invoice_id", { length: 255 }),
// }, (table) => ({
//     bookingIdx: index("booking_idx").on(table.bookingId),
//     customerIdx: index("customer_idx").on(table.customerId),
//     invoiceIdx: index("invoice_idx").on(table.invoiceId),
// }));

