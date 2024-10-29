import { relations, sql } from "drizzle-orm";
import { mysqlTable, serial, varchar, text, json, timestamp, index, int, uniqueIndex, boolean, datetime, decimal } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enum types
export const PropertyType = {
  text: 'text',
  number: 'number',
  list: 'list',
  truthy: 'truthy',
  date: 'date',
  textarea: 'textarea',
} as const;

export const Status = {
  Available: 'Available',
  Used: 'Used',
  Maintenance: 'Maintenance',
} as const;

export const Priority = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
} as const;

export const MaintenanceStatus = {
  Scheduled: 'Scheduled',
  InProgress: 'InProgress',
  Completed: 'Completed',
} as const;

export const Role = {
  SystemAdmin: 'SystemAdmin',
  Admin: 'Admin',
  User: 'User',
  Customer: 'Customer',
  Owner: 'Owner',
} as const;

// Tenant Model
export const Tenant = mysqlTable("tenant", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 255 }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'string' }),
}, (tenant) => ({
  subdomainUniqueIdx: uniqueIndex("subdomain_unique").on(tenant.subdomain),
}));

export const TenantRelations = relations(Tenant, ({ many }) => ({
  users: many(User),
  assetTypes: many(AssetType),
  assetProperties: many(AssetProperty),
  categories: many(Category),
  groupTypes: many(GroupType),
  bookingForms: many(BookingForm),
  assets: many(Asset),
}));

export const selectTenantSchema = createSelectSchema(Tenant);
export const insertTenantSchema = createInsertSchema(Tenant).omit({ id: true, createdAt: true, updatedAt: true });

// User Model
export const User = mysqlTable("user", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'string' }),
  tenantId: varchar("tenant_id", { length: 255 }),
}, (table) => ({
  emailUniqueIdx: uniqueIndex("email_unique").on(table.email),
}));

export const UserRelations = relations(User, ({ one, many }) => ({
  tenant: one(Tenant, { fields: [User.tenantId], references: [Tenant.id] }),
  customer: one(Customer, { fields: [User.id], references: [Customer.userId] }),
  owner: one(Owner, { fields: [User.id], references: [Owner.id] }),
  assignedMaintenanceTasks: many(MaintenanceTask),
}));

export const selectUserSchema = createSelectSchema(User);
export const insertUserSchema = createInsertSchema(User, {
  email: (schema) => schema.email.email(),
  password: (schema) => schema.password.min(8),
  role: z.enum([Role.SystemAdmin, Role.Admin, Role.User, Role.Customer, Role.Owner]),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Session Model
export const Session = mysqlTable("session", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  expiresAt: datetime("expires_at").notNull(),
});

export const SessionRelations = relations(Session, ({ one }) => ({
  user: one(User, { fields: [Session.userId], references: [User.id] }),
}));


// Customer Model
export const Customer = mysqlTable("customer", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 255 }),
  address: varchar("address", { length: 255 }),
  dateOfBirth: datetime("date_of_birth"),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'string' }),
  userId: varchar("user_id", { length: 255 }).notNull(),
}, (table) => ({
  emailUniqueIdx: uniqueIndex("email_unique").on(table.email),
  userIdUniqueIdx: uniqueIndex("user_id_unique").on(table.userId),
}));

export const CustomerRelations = relations(Customer, ({ one, many }) => ({
  user: one(User, { fields: [Customer.userId], references: [User.id] }),
  bookings: many(Booking),
  payments: many(Payment),
  invoices: many(Invoice),
}));

export const selectCustomerSchema = createSelectSchema(Customer);
export const insertCustomerSchema = createInsertSchema(Customer, {
  email: (schema) => schema.email.email(),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Owner Model
export const Owner = mysqlTable("owner", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 255 }),
  address: varchar("address", { length: 255 }),
  companyName: varchar("company_name", { length: 255 }),
  taxId: varchar("tax_id", { length: 255 }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'string' }),
  userId: varchar("user_id", { length: 255 }).notNull(),
}, (table) => ({
  emailUniqueIdx: uniqueIndex("email_unique").on(table.email),
  userIdUniqueIdx: uniqueIndex("user_id_unique").on(table.userId),
}));

export const OwnerRelations = relations(Owner, ({ one, many }) => ({
  user: one(User, { fields: [Owner.userId], references: [User.id] }),
  ownedAssets: many(Asset),
  bookings: many(Booking),
}));

export const selectOwnerSchema = createSelectSchema(Owner);
export const insertOwnerSchema = createInsertSchema(Owner, {
  email: (schema) => schema.email.email(),
}).omit({ id: true, createdAt: true, updatedAt: true });

// AssetType Model
export const AssetType = mysqlTable("asset_type", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  bookingFormId: varchar("booking_form_id", { length: 255 }),
  tenantId: varchar("tenant_id", { length: 255 }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'string' }),
}, (table) => ({
  nameUniqueIdx: uniqueIndex("name_unique").on(table.name),
  bookingFormUniqueIdx: uniqueIndex("booking_form_unique").on(table.bookingFormId),
}));

export const AssetTypeRelations = relations(AssetType, ({ one, many }) => ({
  tenant: one(Tenant, { fields: [AssetType.tenantId], references: [Tenant.id] }),
  bookingForm: one(BookingForm, { fields: [AssetType.bookingFormId], references: [BookingForm.id] }),
  assetTypeHasProperties: many(AssetTypeHasProperties),
  assets: many(Asset),
}));

export const selectAssetTypeSchema = createSelectSchema(AssetType);
export const insertAssetTypeSchema = createInsertSchema(AssetType).omit({ id: true, createdAt: true, updatedAt: true });

// AssetProperty Model
export const AssetProperty = mysqlTable("asset_property", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  propertyType: varchar("property_type", { length: 255 }).notNull(),
  tenantId: varchar("tenant_id", { length: 255 }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'string' }),
}, (table) => ({
  nameUniqueIdx: uniqueIndex("name_unique").on(table.name),
}));

export const AssetPropertyRelations = relations(AssetProperty, ({ one, many }) => ({
  tenant: one(Tenant, { fields: [AssetProperty.tenantId], references: [Tenant.id] }),
  assetTypeHasProperties: many(AssetTypeHasProperties),
  assetHasProperties: many(AssetHasProperties),
  categoryHasProperties: many(CategoryHasProperties),
}));

export const selectAssetPropertySchema = createSelectSchema(AssetProperty);
export const insertAssetPropertySchema = createInsertSchema(AssetProperty, {
  propertyType: z.enum([PropertyType.text, PropertyType.number, PropertyType.list, PropertyType.truthy, PropertyType.date, PropertyType.textarea]),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const patchAssetPropertySchema = insertAssetPropertySchema.partial();

// AssetTypeHasProperties Model
export const AssetTypeHasProperties = mysqlTable("asset_type_has_properties", {
  id: serial("id").primaryKey(),
  assetTypeId: int("asset_type_id").notNull(),
  assetPropertyId: int("asset_property_id").notNull(),
  required: boolean("required").default(false).notNull(),
}, (table) => ({
  assetTypePropertyUniqueIdx: uniqueIndex("asset_type_property_unique").on(table.assetTypeId, table.assetPropertyId),
}));

export const AssetTypeHasPropertiesRelations = relations(AssetTypeHasProperties, ({ one }) => ({
  assetType: one(AssetType, { fields: [AssetTypeHasProperties.assetTypeId], references: [AssetType.id] }),
  assetProperty: one(AssetProperty, { fields: [AssetTypeHasProperties.assetPropertyId], references: [AssetProperty.id] }),
}));

export const selectAssetTypeHasPropertiesSchema = createSelectSchema(AssetTypeHasProperties);
export const insertAssetTypeHasPropertiesSchema = createInsertSchema(AssetTypeHasProperties).omit({ id: true });

// Category Model
export const Category = mysqlTable("category", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  schema: json("schema").notNull(),
  assetTypeId: int("asset_type_id").notNull(),
  tenantId: varchar("tenant_id", { length: 255 }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'string' }),
}, (table) => ({
  assetTypeIdx: index("asset_type_idx").on(table.assetTypeId),
}));

export const CategoryRelations = relations(Category, ({ one, many }) => ({
  tenant: one(Tenant, { fields: [Category.tenantId], references: [Tenant.id] }),
  assetType: one(AssetType, { fields: [Category.assetTypeId], references: [AssetType.id] }),
  assetHasCategories: many(AssetHasCategories),
  categoryHasProperties: many(CategoryHasProperties),
}));

export const selectCategorySchema = createSelectSchema(Category);
export const insertCategorySchema = createInsertSchema(Category).omit({ id: true, createdAt: true, updatedAt: true });

// CategoryHasProperties Model
export const CategoryHasProperties = mysqlTable("category_has_properties", {
  id: serial("id").primaryKey(),
  categoryId: int("category_id").notNull(),
  assetPropertyId: int("asset_property_id").notNull(),
}, (table) => ({
  categoryPropertyUniqueIdx: uniqueIndex("category_property_unique").on(table.categoryId, table.assetPropertyId),
}));

export const CategoryHasPropertiesRelations = relations(CategoryHasProperties, ({ one }) => ({
  category: one(Category, { fields: [CategoryHasProperties.categoryId], references: [Category.id] }),
  assetProperty: one(AssetProperty, { fields: [CategoryHasProperties.assetPropertyId], references: [AssetProperty.id] }),
}));

export const selectCategoryHasPropertiesSchema = createSelectSchema(CategoryHasProperties);
export const insertCategoryHasPropertiesSchema = createInsertSchema(CategoryHasProperties).omit({ id: true });

// GroupType Model
export const GroupType = mysqlTable("group_type", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  tenantId: varchar("tenant_id", { length: 255 }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'string' }),
});

export const GroupTypeRelations = relations(GroupType, ({ one, many }) => ({
  tenant: one(Tenant, { fields: [GroupType.tenantId], references: [Tenant.id] }),
  groups: many(Group),
}));

export const selectGroupTypeSchema = createSelectSchema(GroupType);
export const insertGroupTypeSchema = createInsertSchema(GroupType).omit({ id: true, createdAt: true, updatedAt: true });

// Group Model
export const Group = mysqlTable("group", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  groupTypeId: int("group_type_id").notNull(),
  createdAt:  timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'string' }),
}, (table) => ({
  groupTypeIdx: index("group_type_idx").on(table.groupTypeId),
}));

export const GroupRelations = relations(Group, ({ one, many }) => ({
  groupType: one(GroupType, { fields: [Group.groupTypeId], references: [GroupType.id] }),
  assets: many(Asset),
}));

export const selectGroupSchema = createSelectSchema(Group);
export const insertGroupSchema = createInsertSchema(Group).omit({ id: true, createdAt: true, updatedAt: true });

// Asset Model
export const Asset = mysqlTable("asset", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull(),
  requiresApproval: boolean("requires_approval").default(false).notNull(),
  assetTypeId: int("asset_type_id").notNull(),
  groupId: int("group_id"),
  ownerId: varchar("owner_id", { length: 255 }),
  tenantId: varchar("tenant_id", { length: 255 }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'string' }),
}, (table) => ({
  assetTypeIdx: index("asset_type_idx").on(table.assetTypeId),
  groupIdx: index("group_idx").on(table.groupId),
  ownerIdx: index("owner_idx").on(table.ownerId),
}));

export const AssetRelations = relations(Asset, ({ one, many }) => ({
  tenant: one(Tenant, { fields: [Asset.tenantId], references: [Tenant.id] }),
  assetType: one(AssetType, { fields: [Asset.assetTypeId], references: [AssetType.id] }),
  group: one(Group, { fields: [Asset.groupId], references: [Group.id] }),
  owner: one(Owner, { fields: [Asset.ownerId], references: [Owner.id] }),
  bookings: many(Booking),
  maintenanceTasks: many(MaintenanceTask),
  files: many(File),
  assetHasProperties: many(AssetHasProperties),
  assetHasCategories: many(AssetHasCategories),
}));

export const selectAssetSchema = createSelectSchema(Asset);
export const insertAssetSchema = createInsertSchema(Asset, {
  status: z.enum([Status.Available, Status.Used, Status.Maintenance]),
}).omit({ id: true, createdAt: true, updatedAt: true });

// AssetHasProperties Model
export const AssetHasProperties = mysqlTable("asset_has_properties", {
  id: serial("id").primaryKey(),
  assetId: int("asset_id").notNull(),
  assetPropertyId: int("asset_property_id").notNull(),
  value: varchar("value", { length: 255 }).notNull(),
}, (table) => ({
  assetPropertyUniqueIdx: uniqueIndex("asset_property_unique").on(table.assetId, table.assetPropertyId),
}));

export const AssetHasPropertiesRelations = relations(AssetHasProperties, ({ one }) => ({
  asset: one(Asset, { fields: [AssetHasProperties.assetId], references: [Asset.id] }),
  assetProperty: one(AssetProperty, { fields: [AssetHasProperties.assetPropertyId], references: [AssetProperty.id] }),
}));

export const selectAssetHasPropertiesSchema = createSelectSchema(AssetHasProperties);
export const insertAssetHasPropertiesSchema = createInsertSchema(AssetHasProperties).omit({ id: true });

// AssetHasCategories Model
export const AssetHasCategories = mysqlTable("asset_has_categories", {
  id: serial("id").primaryKey(),
  assetId: int("asset_id").notNull(),
  categoryId: int("category_id").notNull(),
}, (table) => ({
  assetCategoryUniqueIdx: uniqueIndex("asset_category_unique").on(table.assetId, table.categoryId),
}));

export const AssetHasCategoriesRelations = relations(AssetHasCategories, ({ one }) => ({
  asset: one(Asset, { fields: [AssetHasCategories.assetId], references: [Asset.id] }),
  category: one(Category, { fields: [AssetHasCategories.categoryId], references: [Category.id] }),
}));

export const selectAssetHasCategoriesSchema = createSelectSchema(AssetHasCategories);
export const insertAssetHasCategoriesSchema = createInsertSchema(AssetHasCategories).omit({ id: true });

// BookingForm Model
export const BookingForm = mysqlTable("booking_form", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fields: json("fields").notNull(),
  conditions: json("conditions"),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'string' }),
  assetTypeId: int("asset_type_id"),
  tenantId: varchar("tenant_id", { length: 255 }),
}, (table) => ({
  assetTypeIdx: index("asset_type_idx").on(table.assetTypeId),
}));

export const BookingFormRelations = relations(BookingForm, ({ one, many }) => ({
  tenant: one(Tenant, { fields: [BookingForm.tenantId], references: [Tenant.id] }),
  assetType: one(AssetType, { fields: [BookingForm.assetTypeId], references: [AssetType.id] }),
  bookings: many(Booking),
}));

export const selectBookingFormSchema = createSelectSchema(BookingForm);
export const insertBookingFormSchema = createInsertSchema(BookingForm).omit({ id: true, createdAt: true, updatedAt: true });

// Booking Model
export const Booking = mysqlTable("booking", {
  id: serial("id").primaryKey(),
  startDate: datetime("start_date").notNull(),
  endDate: datetime("end_date").notNull(),
  status: varchar("status", { length: 255 }).notNull(),
  formData: json("form_data"),
  totalPrice: decimal({ precision: 10, scale: 2 }),
  message: text("message"),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'string' }),
  assetId: int("asset_id").notNull(),
  customerId: varchar("customer_id", { length: 255 }).notNull(),
  ownerId: varchar("owner_id", { length: 255 }),
  bookingFormId: varchar("booking_form_id", { length: 255 }).notNull(),
}, (table) => ({
  assetIdx: index("asset_idx").on(table.assetId),
  customerIdx: index("customer_idx").on(table.customerId),
  ownerIdx: index("owner_idx").on(table.ownerId),
  bookingFormIdx: index("booking_form_idx").on(table.bookingFormId),
}));

export const BookingRelations = relations(Booking, ({ one, many }) => ({
  asset: one(Asset, { fields: [Booking.assetId], references: [Asset.id] }),
  customer: one(Customer, { fields: [Booking.customerId], references: [Customer.id] }),
  owner: one(Owner, { fields: [Booking.ownerId], references: [Owner.id] }),
  bookingForm: one(BookingForm, { fields: [Booking.bookingFormId], references: [BookingForm.id] }),
  payments: many(Payment),
  invoices: many(Invoice),
}));

export const selectBookingSchema = createSelectSchema(Booking);
export const insertBookingSchema = createInsertSchema(Booking).omit({ id: true, createdAt: true, updatedAt: true });

// MaintenanceTask Model
export const MaintenanceTask = mysqlTable("maintenance_task", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 255 }).notNull(),
  priority: varchar("priority", { length: 255 }),
  startDate: datetime("start_date").notNull(),
  endDate: datetime("end_date"),
  cost: decimal({ precision: 10, scale: 2 }),
  assetId: int("asset_id").notNull(),
  assignedToId: varchar("assigned_to_id", { length: 255 }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'string' }),
}, (table) => ({
  assetIdx: index("asset_idx").on(table.assetId),
  assignedToIdx: index("assigned_to_idx").on(table.assignedToId),
}));

export const MaintenanceTaskRelations = relations(MaintenanceTask, ({ one, many }) => ({
  asset: one(Asset, { fields: [MaintenanceTask.assetId], references: [Asset.id] }),
  assignedTo: one(User, { fields: [MaintenanceTask.assignedToId], references: [User.id] }),
  files: many(File),
}));

export const selectMaintenanceTaskSchema = createSelectSchema(MaintenanceTask);
export const insertMaintenanceTaskSchema = createInsertSchema(MaintenanceTask, {
  status: z.enum([MaintenanceStatus.Scheduled, MaintenanceStatus.InProgress, MaintenanceStatus.Completed]),
  priority: z.enum([Priority.Low, Priority.Medium, Priority.High]),
}).omit({ id: true, createdAt: true, updatedAt: true });

// File Model
export const File = mysqlTable("file", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 255 }).notNull(),
  fileSize: int("file_size").notNull(),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  assetId: int("asset_id"),
  maintenanceTaskId: int("maintenance_task_id"),
}, (table) => ({
  assetIdx: index("asset_idx").on(table.assetId),
  maintenanceTaskIdx: index("maintenance_task_idx").on(table.maintenanceTaskId),
}));

export const FileRelations = relations(File, ({ one }) => ({
  asset: one(Asset, { fields: [File.assetId], references: [Asset.id] }),
  maintenanceTask: one(MaintenanceTask, { fields: [File.maintenanceTaskId], references: [MaintenanceTask.id] }),
}));

export const selectFileSchema = createSelectSchema(File);
export const insertFileSchema = createInsertSchema(File).omit({ id: true, uploadedAt: true });

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

