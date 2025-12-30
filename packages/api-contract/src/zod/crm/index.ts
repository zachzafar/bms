import { z } from "zod";


export const InsertContactSchema = z.object({
    id: z.number().optional(),
    tenantId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    dob: z.date().nullable().optional(),
    source: z.enum(["Website", "Referral", "Walk-In", "Social", "Other"]).optional(),
});
export const SelectContactSchema = z.object({
    id: z.number(),
    tenantId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    dob: z.date().nullable(),
    source: z.enum(["Website", "Referral", "Walk-In", "Social", "Other"]).nullable(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});
export const UpdateContactSchema = InsertContactSchema.partial().required({ id: true, tenantId: true });

export type InsertContact = z.infer<typeof InsertContactSchema>;
export type SelectContact = z.infer<typeof SelectContactSchema>;
export type UpdateContact = z.infer<typeof UpdateContactSchema>;

/* -------------------------------- Inquiry -------------------------- */
export const InsertInquirySchema = z.object({
    id: z.number().optional(),
    tenantId: z.string(),
    contactId: z.number(),
    assetId: z.string(),
    inquiryDate: z.date(),
    status: z.enum(["New", "Follow-Up", "Closed"]).optional(),
    followUpDate: z.date().nullable().optional(),
    assignedTo: z.string(),
    notes: z.string().nullable().optional(),
});
export const SelectInquirySchema = z.object({
    id: z.number(),
    tenantId: z.string(),
    contactId: z.number(),
    assetId: z.string(),
    inquiryDate: z.date(),
    status: z.enum(["New", "Follow-Up", "Closed"]),
    followUpDate: z.date().nullable(),
    assignedTo: z.string(),
    notes: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});
export const UpdateInquirySchema = InsertInquirySchema.partial().required({ id: true, tenantId: true });

export type InsertInquiry = z.infer<typeof InsertInquirySchema>;
export type SelectInquiry = z.infer<typeof SelectInquirySchema>;
export type UpdateInquiry = z.infer<typeof UpdateInquirySchema>;

/* ---------------------------- Communication Log -------------------- */
export const InsertCommunicationLogSchema = z.object({
    id: z.number().optional(),
    tenantId: z.string(),
    contactId: z.number(),
    userId: z.string(),
    date: z.string(),
    type: z.enum(["Email", "Phone Call", "Meeting"]),
    summary: z.string(),
});
export const SelectCommunicationLogSchema = z.object({
    id: z.number(),
    tenantId: z.string(),
    contactId: z.number(),
    userId: z.string(),
    date: z.date(),
    type: z.enum(["Email", "Phone Call", "Meeting"]),
    summary: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});
export const UpdateCommunicationLogSchema = InsertCommunicationLogSchema.partial().required({ id: true, tenantId: true, contactId: true });

export type InsertCommunicationLog = z.infer<typeof InsertCommunicationLogSchema>;
export type SelectCommunicationLog = z.infer<typeof SelectCommunicationLogSchema>;
export type UpdateCommunicationLog = z.infer<typeof UpdateCommunicationLogSchema>;

/* -------------------------------- Feedback ------------------------- */
export const InsertFeedbackSchema = z.object({
    id: z.number().optional(),
    assetId: z.string(),
    comments: z.string().nullable().optional(),
    rating: z.number().int().min(1).max(5),
    contactId: z.number(),
    viewingDate: z.string(),
});
export const SelectFeedbackSchema = z.object({
    id: z.number(),
    assetId: z.string(),
    viewingDate: z.date(),
    comments: z.string().nullable(),
    rating: z.number(),
    contactId: z.number(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});
export const UpdateFeedbackSchema = InsertFeedbackSchema.partial().required({ id: true,contactId:true });

export type InsertFeedback = z.infer<typeof InsertFeedbackSchema>;
export type SelectFeedback = z.infer<typeof SelectFeedbackSchema>;
export type UpdateFeedback = z.infer<typeof UpdateFeedbackSchema>;

/* -------------------------------- Brochure ------------------------- */
export const InsertBrochureSchema = z.object({
    id: z.number().optional(),
    type: z.string(),
    content: z.string().nullable().optional(),
    tenantId: z.string(),
});
export const SelectBrochureSchema = z.object({
    id: z.number(),
    type: z.string(),
    content: z.string().nullable(),
    tenantId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});
export const UpdateBrochureSchema = InsertBrochureSchema.partial().required({ id: true });

export type InsertBrochure = z.infer<typeof InsertBrochureSchema>;
export type SelectBrochure = z.infer<typeof SelectBrochureSchema>;
export type UpdateBrochure = z.infer<typeof UpdateBrochureSchema>;
/* -------------------------- Brochure <-> Asset --------------------- */
export const InsertBrochureAssetSchema = z.object({
    id: z.number().optional(),
    tenantId: z.string(),
    brochureId: z.number(),
    assetId: z.string(),
});
export const SelectBrochureAssetSchema = z.object({
    id: z.number(),
    tenantId: z.string(),
    brochureId: z.number(),
    assetId: z.string(),
    createdAt: z.date(),
});
export const UpdateBrochureAssetSchema = InsertBrochureAssetSchema.partial().required({ id: true});

export type InsertBrochureAsset = z.infer<typeof InsertBrochureAssetSchema>;
export type SelectBrochureAsset = z.infer<typeof SelectBrochureAssetSchema>;
export type UpdateBrochureAsset = z.infer<typeof UpdateBrochureAssetSchema>;
/* ---------------------------------- Task --------------------------- */
export const InsertTaskSchema = z.object({
    id: z.number().optional(),
    userId: z.string(),
    description: z.string(),
    dueDate: z.date(),
    category: z.enum(["Follow-up","Marketing","Inspection","Administrative","Documentation","Meeting","Research","Communication"]).nullable().optional(),
    priority: z.enum(["Low","Medium","High"]).optional(),
    status: z.enum(["Pending", "Completed", "Overdue"]).optional(),
    contactId: z.number().optional(),
});
export const SelectTaskSchema = z.object({
    id: z.number(),
    tenantId: z.string(),
    userId: z.string(),
    description: z.string(),
    dueDate: z.date(),
    category: z.enum(["Follow-up","Marketing","Inspection","Administrative","Documentation","Meeting","Research","Communication"]).nullable(),
    priority: z.enum(["Low","Medium","High"]),
    status: z.enum(["Pending", "Completed", "Overdue"]),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
    contactId: z.number().nullable(),
});
export const UpdateTaskSchema = InsertTaskSchema.partial().required({ id: true});

export type InsertTask = z.infer<typeof InsertTaskSchema>;
export type SelectTask = z.infer<typeof SelectTaskSchema>;
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;
/* -------------------------------- Document ------------------------- */
export const InsertDocumentSchema = z.object({
    id: z.number().optional(),
    tenantId: z.string(),
    contactId: z.number(),
    documentType: z.enum(["Contract", "Brochure", "Feedback Form", "Other"]).optional(),
    filePath: z.string(),
    uploadedBy: z.string(),
    uploadedAt: z.date(),
});
export const SelectDocumentSchema = z.object({
    id: z.number(),
    tenantId: z.string(),
    contactId: z.number(),
    documentType: z.enum(["Contract", "Brochure", "Feedback Form", "Other"]),
    filePath: z.string(),
    uploadedBy: z.string(),
    uploadedAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});
export const UpdateDocumentSchema = InsertDocumentSchema.partial().required({ id: true});

export type InsertDocument = z.infer<typeof InsertDocumentSchema>;
export type SelectDocument = z.infer<typeof SelectDocumentSchema>;
export type UpdateDocument = z.infer<typeof UpdateDocumentSchema>;

/* -------------------------- Brochure <-> Contact ------------------- */
export const InsertBrochureContactSchema = z.object({
    contactId: z.number(),
    brochureId: z.number(),
});
export const SelectBrochureContactSchema = z.object({
    contactId: z.number(),
    brochureId: z.number(),
});

export type InsertBrochureContact = z.infer<typeof InsertBrochureContactSchema>;
export type SelectBrochureContact = z.infer<typeof SelectBrochureContactSchema>;

/* -------------------------------- Offers --------------------------- */
export const InsertOffersSchema = z.object({
    id: z.number().optional(),
    tenantId: z.string(),
    assetId: z.string(),
    offerDate: z.date(),
    offerAmount: z.string().nullable().optional(), // decimal
    notes: z.string().nullable().optional(),
    offerStatus: z.enum(["New", "Accepted", "Rejected"]).optional(),
    contactId: z.number(),
});
export const SelectOffersSchema = z.object({
    id: z.number(),
    tenantId: z.string(),
    assetId: z.string(),
    offerDate: z.date(),
    offerAmount: z.string().nullable(),
    notes: z.string().nullable(),
    offerStatus: z.enum(["New", "Accepted", "Rejected"]),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
    contactId: z.number(),
});
export const UpdateOffersSchema = InsertOffersSchema.partial().required({ id: true, tenantId: true });

export type InsertOffers = z.infer<typeof InsertOffersSchema>;
export type SelectOffers = z.infer<typeof SelectOffersSchema>;
export type UpdateOffers = z.infer<typeof UpdateOffersSchema>;
