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
  bigint,
  decimal,
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
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 64 }),
    address: varchar("address", { length: 1024 }),
    dob: datetime("dob"),
    source: inquirySource.default("Website"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  },
  (t) => ({
    emailPerTenant: uniqueIndex("contact_email_tenant_unique").on(t.tenantId, t.email),

    tenantIdx: index("contact_tenant_idx").on(t.tenantId),
  })
);

export const SelectContact = createSelectSchema(Contact)
export const InsertContact = createInsertSchema(Contact)
export type InsertContactType = z.infer<typeof InsertContact>
export type SelectContactType = z.infer<typeof SelectContact>

export const contactRelations = relations(Contact, ({ one, many }) => ({
  // profiles
  customerProfile: many(Customer), // using your table name customer_details (see below)
  ownerProfile: many(Owner),
  // crm/ops
  inquiries: many(Inquiry),
  communications: many(CommunicationLog),
  feedbacks: many(Feedback),
  // FIX: brochures is a many-to-many via the join table, not a direct FK to Brochure
  brochures: many(BrochureContact),
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
    contactId: bigint("contact_id", { mode: 'bigint', unsigned: true }).notNull()
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

export const Offers = mysqlTable("offers", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id", { length: 36 }).notNull()
    .references(() => Tenant.id, { onDelete: "cascade" }),
  contactId: bigint("contact_id", { mode: 'bigint', unsigned: true }).notNull()
    .references(() => Contact.id, { onDelete: "cascade" }),
  assetId: varchar("asset_id", { length: 255 }).notNull()
    .references(() => Asset.id, { onDelete: "cascade" }),
  offerDate: datetime("offer_date").notNull(),
  offerAmount: decimal("offer_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  offerStatus: mysqlEnum("offer_status", ["New", "Accepted", "Rejected"]).notNull().default("New"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),

})

/* ------------------------------- Feedback --------------------------- */
export const Feedback = mysqlTable(
  "feedback",
  {
    id: serial("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull()
      .references(() => Tenant.id, { onDelete: "cascade" }),
    contactId: bigint("contact_id", { mode: 'bigint', unsigned: true }).notNull()
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
    type: varchar("type", { length: 255 }).notNull(),
    content: text("content"),
    tenantId: varchar("tenant_id", { length: 36 }).notNull()
      .references(() => Tenant.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantIdx: index("brochure_tenant_idx").on(t.tenantId),
  })
);

export const BrochureContact = mysqlTable(
  'brochure_has_contacts', {
    contactId: bigint("contact_id", { mode: 'bigint', unsigned: true }).notNull()
      .references(() => Contact.id, { onDelete: "cascade" }),
    brochureId: bigint("brochure_id", { mode: 'bigint', unsigned: true }).notNull()
      .references(() => Brochure.id, { onDelete: "cascade" }),
  }
)

export const BrochureAsset = mysqlTable(
  "brochure_has_assets",
  {
    id: serial("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull()
      .references(() => Tenant.id, { onDelete: "cascade" }),
    brochureId: bigint("brochure_id", { mode: 'bigint', unsigned: true }).notNull()
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

export const brochureContactRelations = relations(BrochureContact, ({ one }) => ({
  brochure: one(Brochure, { fields: [BrochureContact.brochureId], references: [Brochure.id] }),
  contact: one(Contact, { fields: [BrochureContact.contactId], references: [Contact.id] }),
}));

export const brochureRelations = relations(Brochure, ({ one, many }) => ({
  assets: many(BrochureAsset),
  contacts: many(BrochureContact),
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
    contactId: bigint("contact_id", { mode: 'bigint', unsigned: true }).notNull()
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
    contactId: bigint("contact_id", { mode: 'bigint', unsigned: true })
      .references(() => Contact.id, { onDelete: "set null" }),
    description: text("description").notNull(),
    dueDate: datetime("due_date").notNull(),
    category: mysqlEnum("category",[
  "Follow-up",
  "Marketing",
  "Inspection",
  "Administrative",
  "Documentation",
  "Meeting",
  "Research",
  "Communication"]),
    priority: mysqlEnum('priority',["Low","Medium","High"]).notNull().default("Medium"),
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
    contactId: bigint("contact_id", { mode: 'bigint', unsigned: true }).notNull()
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
  .omit({ createdAt: true, updatedAt: true, contactId: true })
  .extend({ contactId: z.number() });
export const SelectInquirySchema = createSelectSchema(Inquiry)
  .omit({ contactId: true })
  .extend({ contactId: z.number() });
export const UpdateInquirySchema = InsertInquirySchema.partial().required({ id: true, tenantId: true });

export type InsertInquiry = z.infer<typeof InsertInquirySchema>;
export type SelectInquiry = z.infer<typeof SelectInquirySchema>;
export type UpdateInquiry = z.infer<typeof UpdateInquirySchema>;

/* ---------------------------- Communication Log -------------------- */
export const InsertCommunicationLogSchema = createInsertSchema(CommunicationLog)
  .omit({ createdAt: true, updatedAt: true, contactId: true })
  .extend({ contactId: z.number() });
export const SelectCommunicationLogSchema = createSelectSchema(CommunicationLog)
  .omit({ contactId: true })
  .extend({ contactId: z.number() });
export const UpdateCommunicationLogSchema = InsertCommunicationLogSchema.partial().required({ id: true, tenantId: true, contactId: true });

export type InsertCommunicationLog = z.infer<typeof InsertCommunicationLogSchema>;
export type SelectCommunicationLog = z.infer<typeof SelectCommunicationLogSchema>;
export type UpdateCommunicationLog = z.infer<typeof UpdateCommunicationLogSchema>;

/* -------------------------------- Feedback ------------------------- */
export const InsertFeedbackSchema = createInsertSchema(Feedback)
  .omit({ createdAt: true, updatedAt: true, contactId: true,tenantId:true })
  .extend({
    rating: z.number().int().min(1).max(5),
    contactId: z.number()
  });
export const SelectFeedbackSchema = createSelectSchema(Feedback)
  .omit({ contactId: true })
  .extend({ contactId: z.number() });
export const UpdateFeedbackSchema = InsertFeedbackSchema.partial().required({ id: true,contactId:true });

export type InsertFeedback = z.infer<typeof InsertFeedbackSchema>;
export type SelectFeedback = z.infer<typeof SelectFeedbackSchema>;
export type UpdateFeedback = z.infer<typeof UpdateFeedbackSchema>;

/* -------------------------------- Brochure ------------------------- */
export const InsertBrochureSchema = createInsertSchema(Brochure)
  .omit({ createdAt: true, updatedAt: true });
export const SelectBrochureSchema = createSelectSchema(Brochure);
export const UpdateBrochureSchema = InsertBrochureSchema.partial().required({ id: true });

export type InsertBrochure = z.infer<typeof InsertBrochureSchema>;
export type SelectBrochure = z.infer<typeof SelectBrochureSchema>;
export type UpdateBrochure = z.infer<typeof UpdateBrochureSchema>;
/* -------------------------- Brochure <-> Asset --------------------- */
export const InsertBrochureAssetSchema = createInsertSchema(BrochureAsset)
  .omit({ createdAt: true, brochureId: true })
  .extend({ brochureId: z.number() });
export const SelectBrochureAssetSchema = createSelectSchema(BrochureAsset)
  .omit({ brochureId: true })
  .extend({ brochureId: z.number() });
export const UpdateBrochureAssetSchema = InsertBrochureAssetSchema.partial().required({ id: true});

export type InsertBrochureAsset = z.infer<typeof InsertBrochureAssetSchema>;
export type SelectBrochureAsset = z.infer<typeof SelectBrochureAssetSchema>;
export type UpdateBrochureAsset = z.infer<typeof UpdateBrochureAssetSchema>;
/* ---------------------------------- Task --------------------------- */
export const InsertTaskSchema = createInsertSchema(Task)
  .omit({ createdAt: true, updatedAt: true, contactId: true })
  .extend({ contactId: z.number().optional() });
export const SelectTaskSchema = createSelectSchema(Task)
  .omit({ contactId: true })
  .extend({ contactId: z.number().nullable() });
export const UpdateTaskSchema = InsertTaskSchema.partial().required({ id: true});

export type InsertTask = z.infer<typeof InsertTaskSchema>;
export type SelectTask = z.infer<typeof SelectTaskSchema>;
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;
/* -------------------------------- Document ------------------------- */
export const InsertDocumentSchema = createInsertSchema(Document)
  .omit({ createdAt: true, updatedAt: true, contactId: true })
  .extend({ contactId: z.number() });
export const SelectDocumentSchema = createSelectSchema(Document)
  .omit({ contactId: true })
  .extend({ contactId: z.number() });
export const UpdateDocumentSchema = InsertDocumentSchema.partial().required({ id: true});

export type InsertDocument = z.infer<typeof InsertDocumentSchema>;
export type SelectDocument = z.infer<typeof SelectDocumentSchema>;
export type UpdateDocument = z.infer<typeof UpdateDocumentSchema>;

/* -------------------------- Brochure <-> Contact ------------------- */
export const InsertBrochureContactSchema = createInsertSchema(BrochureContact)
  .omit({ contactId: true, brochureId: true })
  .extend({ 
    contactId: z.number(),
    brochureId: z.number()
  });
export const SelectBrochureContactSchema = createSelectSchema(BrochureContact)
  .omit({ contactId: true, brochureId: true })
  .extend({ 
    contactId: z.number(),
    brochureId: z.number()
  });

export type InsertBrochureContact = z.infer<typeof InsertBrochureContactSchema>;
export type SelectBrochureContact = z.infer<typeof SelectBrochureContactSchema>;

/* -------------------------------- Offers --------------------------- */
export const InsertOffersSchema = createInsertSchema(Offers)
  .omit({ createdAt: true, updatedAt: true, contactId: true })
  .extend({ contactId: z.number() });
export const SelectOffersSchema = createSelectSchema(Offers)
  .omit({ contactId: true })
  .extend({ contactId: z.number() });
export const UpdateOffersSchema = InsertOffersSchema.partial().required({ id: true, tenantId: true });

export type InsertOffers = z.infer<typeof InsertOffersSchema>;
export type SelectOffers = z.infer<typeof SelectOffersSchema>;
export type UpdateOffers = z.infer<typeof UpdateOffersSchema>;
