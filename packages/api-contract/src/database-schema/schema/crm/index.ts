// db/schema/crm-contact.ts
import { relations } from "drizzle-orm";
import {
  mysqlTable,
  serial,
  varchar,
  text,
  int,
  datetime,
  timestamp,
  mysqlEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { Tenant } from "../tenant"; // tenants: id varchar(36)
import { Customer, Owner, User } from "../users";    // users: id varchar(36)
import { Asset } from "../asset";   // assets: id varchar(255)


/* ------------------------------- Enums ------------------------------ */
export const inquiryStatus = mysqlEnum("inquiry_status", ["New", "Follow-Up", "Closed"]);
export const communicationType = mysqlEnum("communication_type", ["Email", "Phone Call", "Meeting"]);
export const taskStatus = mysqlEnum("task_status", ["Pending", "Completed", "Overdue"]);
export const documentType = mysqlEnum("document_type", ["Contract", "Brochure", "Feedback Form", "Other"]);
export const inquirySource = mysqlEnum("inquiry_source", ["Website", "Referral", "Walk-In", "Social", "Other"]);

/* -------------------------------- Contact --------------------------- */
/** Canonical person/org record per tenant. Optionally linked to a User. */
export const Contact = mysqlTable(
  "contact",
  {
    id: serial("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull()
      .references(() => Tenant.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .references(() => User.id, { onDelete: "set null" }),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 64 }),
    address: varchar("address", { length: 1024 }),
    source: inquirySource.default("Website"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  },
  (t) => ({
    emailPerTenant: uniqueIndex("contact_email_tenant_unique").on(t.tenantId, t.email),
    uniqueUserPerTenant: uniqueIndex("contact_tenant_user_unique").on(t.tenantId, t.userId),
    tenantIdx: index("contact_tenant_idx").on(t.tenantId),
  })
);

export const contactRelations = relations(Contact, ({ one, many }) => ({
  user: one(User, { fields: [Contact.userId], references: [User.id] }),
  // profiles
  customerProfile: many(Customer), // using your table name customer_details (see below)
  ownerProfile: many(Owner),
  // crm/ops
  inquiries: many(Inquiry),
  communications: many(CommunicationLog),
  feedbacks: many(Feedback),
  brochures: many(Brochure),
  documents: many(Document),
  tasks: many(Task),
}));


/* ------------------------------- Inquiry ---------------------------- */
export const Inquiry = mysqlTable(
  "inquiry",
  {
    id: serial("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull()
      .references(() => Tenant.id, { onDelete: "cascade" }),
    contactId: int("contact_id").notNull()
      .references(() => Contact.id, { onDelete: "cascade" }),
    assetId: varchar("asset_id", { length: 255 }).notNull()
      .references(() => Asset.id, { onDelete: "cascade" }),
    inquiryDate: datetime("inquiry_date").notNull(),
    status: inquiryStatus.notNull().default("New"),
    followUpDate: datetime("follow_up_date"),
    assignedTo: varchar("assigned_to", { length: 36 }).notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantIdx: index("inquiry_tenant_idx").on(t.tenantId),
    contactIdx: index("inquiry_contact_idx").on(t.contactId),
    assetIdx: index("inquiry_asset_idx").on(t.assetId),
    assignedIdx: index("inquiry_assigned_idx").on(t.assignedTo),
    statusIdx: index("inquiry_status_idx").on(t.status),
  })
);

export const inquiryRelations = relations(Inquiry, ({ one }) => ({
  contact: one(Contact, { fields: [Inquiry.contactId], references: [Contact.id] }),
  asset: one(Asset, { fields: [Inquiry.assetId], references: [Asset.id] }),
  assignee: one(User, { fields: [Inquiry.assignedTo], references: [User.id] }),
}));

/* ------------------------------- Feedback --------------------------- */
export const Feedback = mysqlTable(
  "feedback",
  {
    id: serial("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull()
      .references(() => Tenant.id, { onDelete: "cascade" }),
    contactId: int("contact_id").notNull()
      .references(() => Contact.id, { onDelete: "cascade" }),
    assetId: varchar("asset_id", { length: 255 }).notNull()
      .references(() => Asset.id, { onDelete: "cascade" }),
    viewingDate: datetime("viewing_date").notNull(),
    comments: text("comments"),
    rating: int("rating").notNull(), // enforce 1..5 in app
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantIdx: index("feedback_tenant_idx").on(t.tenantId),
    contactIdx: index("feedback_contact_idx").on(t.contactId),
    assetIdx: index("feedback_asset_idx").on(t.assetId),
    ratingIdx: index("feedback_rating_idx").on(t.rating),
  })
);

export const feedbackRelations = relations(Feedback, ({ one }) => ({
  contact: one(Contact, { fields: [Feedback.contactId], references: [Contact.id] }),
  asset: one(Asset, { fields: [Feedback.assetId], references: [Asset.id] }),
}));

/* -------------------------------- Brochure -------------------------- */
export const Brochure = mysqlTable(
  "brochure",
  {
    id: serial("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull()
      .references(() => Tenant.id, { onDelete: "cascade" }),
    contactId: int("contact_id").notNull()
      .references(() => Contact.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantIdx: index("brochure_tenant_idx").on(t.tenantId),
    contactIdx: index("brochure_contact_idx").on(t.contactId),
  })
);

export const BrochureAsset = mysqlTable(
  "brochure_has_assets",
  {
    id: serial("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull()
      .references(() => Tenant.id, { onDelete: "cascade" }),
    brochureId: int("brochure_id").notNull()
      .references(() => Brochure.id, { onDelete: "cascade" }),
    assetId: varchar("asset_id", { length: 255 }).notNull()
      .references(() => Asset.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => ({
    uniquePerBrochure: uniqueIndex("brochure_asset_unique").on(t.tenantId, t.brochureId, t.assetId),
    tenantIdx: index("bp_tenant_idx").on(t.tenantId),
    brochureIdx: index("bp_brochure_idx").on(t.brochureId),
    assetIdx: index("bp_asset_idx").on(t.assetId),
  })
);

export const brochureRelations = relations(Brochure, ({ one, many }) => ({
  contact: one(Contact, { fields: [Brochure.contactId], references: [Contact.id] }),
  assets: many(BrochureAsset),
}));

export const brochureAssetRelations = relations(BrochureAsset, ({ one }) => ({
  brochure: one(Brochure, { fields: [BrochureAsset.brochureId], references: [Brochure.id] }),
  asset: one(Asset, { fields: [BrochureAsset.assetId], references: [Asset.id] }),
}));

/* ---------------------------- Communication Log -------------------- */
export const CommunicationLog = mysqlTable(
  "communication_log",
  {
    id: serial("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull()
      .references(() => Tenant.id, { onDelete: "cascade" }),
    contactId: int("contact_id").notNull()
      .references(() => Contact.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    date: datetime("date").notNull(),
    type: communicationType.notNull(),
    summary: text("summary").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantIdx: index("comm_tenant_idx").on(t.tenantId),
    contactIdx: index("comm_contact_idx").on(t.contactId),
    userIdx: index("comm_user_idx").on(t.userId),
    typeIdx: index("comm_type_idx").on(t.type),
    dateIdx: index("comm_date_idx").on(t.date),
  })
);

export const communicationRelations = relations(CommunicationLog, ({ one }) => ({
  contact: one(Contact, { fields: [CommunicationLog.contactId], references: [Contact.id] }),
  user: one(User, { fields: [CommunicationLog.userId], references: [User.id] }),
}));

/* ---------------------------------- Task --------------------------- */
export const Task = mysqlTable(
  "task",
  {
    id: serial("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull()
      .references(() => Tenant.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    /** Tasks may or may not be tied to a specific contact */
    contactId: int("contact_id")
      .references(() => Contact.id, { onDelete: "set null" }),
    description: text("description").notNull(),
    dueDate: datetime("due_date").notNull(),
    status: taskStatus.notNull().default("Pending"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantIdx: index("task_tenant_idx").on(t.tenantId),
    userIdx: index("task_user_idx").on(t.userId),
    contactIdx: index("task_contact_idx").on(t.contactId),
    statusIdx: index("task_status_idx").on(t.status),
    dueIdx: index("task_due_idx").on(t.dueDate),
  })
);

export const taskRelations = relations(Task, ({ one }) => ({
  user: one(User, { fields: [Task.userId], references: [User.id] }),
  contact: one(Contact, { fields: [Task.contactId], references: [Contact.id] }),
}));

/* -------------------------------- Document ------------------------- */
export const Document = mysqlTable(
  "document",
  {
    id: serial("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull()
      .references(() => Tenant.id, { onDelete: "cascade" }),
    contactId: int("contact_id").notNull()
      .references(() => Contact.id, { onDelete: "cascade" }),
    documentType: documentType.notNull().default("Other"),
    filePath: varchar("file_path", { length: 2048 }).notNull(),
    uploadedBy: varchar("uploaded_by", { length: 36 }).notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    uploadedAt: datetime("uploaded_at").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantIdx: index("doc_tenant_idx").on(t.tenantId),
    contactIdx: index("doc_contact_idx").on(t.contactId),
    typeIdx: index("doc_type_idx").on(t.documentType),
    uploaderIdx: index("doc_uploader_idx").on(t.uploadedBy),
  })
);

export const documentRelations = relations(Document, ({ one }) => ({
  contact: one(Contact, { fields: [Document.contactId], references: [Contact.id] }),
  uploader: one(User, { fields: [Document.uploadedBy], references: [User.id] }),
}));


export const InsertContactSchema = createInsertSchema(Contact).omit({
  createdAt: true,
  updatedAt: true,
});
export const SelectContactSchema = createSelectSchema(Contact);
export const UpdateContactSchema = InsertContactSchema.partial().required({ id: true, tenantId: true });

export type InsertContact = z.infer<typeof InsertContactSchema>;
export type SelectContact = z.infer<typeof SelectContactSchema>;
export type UpdateContact = z.infer<typeof UpdateContactSchema>;

/* -------------------------------- Inquiry -------------------------- */
export const InsertInquirySchema = createInsertSchema(Inquiry)
  .omit({ createdAt: true, updatedAt: true,})
export const SelectInquirySchema = createSelectSchema(Inquiry);
export const UpdateInquirySchema = InsertInquirySchema.partial().required({ id: true, tenantId: true });

export type InsertInquiry = z.infer<typeof InsertInquirySchema>;
export type SelectInquiry = z.infer<typeof SelectInquirySchema>;
export type UpdateInquiry = z.infer<typeof UpdateInquirySchema>;

/* ---------------------------- Communication Log -------------------- */
export const InsertCommunicationLogSchema = createInsertSchema(CommunicationLog)
  .omit({ createdAt: true, updatedAt: true,  })
export const SelectCommunicationLogSchema = createSelectSchema(CommunicationLog);
export const UpdateCommunicationLogSchema = InsertCommunicationLogSchema.partial().required({ id: true, tenantId: true });

export type InsertCommunicationLog = z.infer<typeof InsertCommunicationLogSchema>;
export type SelectCommunicationLog = z.infer<typeof SelectCommunicationLogSchema>;
export type UpdateCommunicationLog = z.infer<typeof UpdateCommunicationLogSchema>;

/* -------------------------------- Feedback ------------------------- */
export const InsertFeedbackSchema = createInsertSchema(Feedback)
  .omit({ createdAt: true, updatedAt: true, })
  .extend({
    rating: z.number().int().min(1).max(5),
  });
export const SelectFeedbackSchema = createSelectSchema(Feedback);
export const UpdateFeedbackSchema = InsertFeedbackSchema.partial().required({ id: true, tenantId: true });

export type InsertFeedback = z.infer<typeof InsertFeedbackSchema>;
export type SelectFeedback = z.infer<typeof SelectFeedbackSchema>;
export type UpdateFeedback = z.infer<typeof UpdateFeedbackSchema>;

/* -------------------------------- Brochure ------------------------- */
export const InsertBrochureSchema = createInsertSchema(Brochure)
  .omit({ createdAt: true, updatedAt: true });
export const SelectBrochureSchema = createSelectSchema(Brochure);
export const UpdateBrochureSchema = InsertBrochureSchema.partial().required({ id: true, tenantId: true });

export type InsertBrochure = z.infer<typeof InsertBrochureSchema>;
export type SelectBrochure = z.infer<typeof SelectBrochureSchema>;
export type UpdateBrochure = z.infer<typeof UpdateBrochureSchema>;

/* -------------------------- Brochure <-> Asset --------------------- */
export const InsertBrochureAssetSchema = createInsertSchema(BrochureAsset)
  .omit({ createdAt: true });
export const SelectBrochureAssetSchema = createSelectSchema(BrochureAsset);
export const UpdateBrochureAssetSchema = InsertBrochureAssetSchema.partial().required({ id: true, tenantId: true });

export type InsertBrochureAsset = z.infer<typeof InsertBrochureAssetSchema>;
export type SelectBrochureAsset = z.infer<typeof SelectBrochureAssetSchema>;
export type UpdateBrochureAsset = z.infer<typeof UpdateBrochureAssetSchema>;

/* ---------------------------------- Task --------------------------- */
export const InsertTaskSchema = createInsertSchema(Task)
  .omit({ createdAt: true, updatedAt: true, })
export const SelectTaskSchema = createSelectSchema(Task);
export const UpdateTaskSchema = InsertTaskSchema.partial().required({ id: true, tenantId: true });

export type InsertTask = z.infer<typeof InsertTaskSchema>;
export type SelectTask = z.infer<typeof SelectTaskSchema>;
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;

/* -------------------------------- Document ------------------------- */
export const InsertDocumentSchema = createInsertSchema(Document)
  .omit({ createdAt: true, updatedAt: true, })
export const SelectDocumentSchema = createSelectSchema(Document);
export const UpdateDocumentSchema = InsertDocumentSchema.partial().required({ id: true, tenantId: true });

export type InsertDocument = z.infer<typeof InsertDocumentSchema>;
export type SelectDocument = z.infer<typeof SelectDocumentSchema>;
export type UpdateDocument = z.infer<typeof UpdateDocumentSchema>;
