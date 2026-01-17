// api/crm.contract.ts
import { initContract } from "@ts-rest/core";
import { z } from "zod";

// NOTE: point these imports at your actual barrel file(s)
import {
  // Contact + profiles
  InsertContactSchema, SelectContactSchema, UpdateContactSchema,
  InsertCustomerSchema, SelectCustomerSchema,
  InsertOwnerSchema, SelectOwnerSchema,
  // CRM entities
  InsertInquirySchema, SelectInquirySchema, UpdateInquirySchema,
  InsertCommunicationLogSchema, SelectCommunicationLogSchema, UpdateCommunicationLogSchema,
  InsertFeedbackSchema, SelectFeedbackSchema, UpdateFeedbackSchema,
  InsertBrochureSchema, SelectBrochureSchema,
  SelectBrochureAssetSchema,
  InsertTaskSchema, SelectTaskSchema, UpdateTaskSchema,
  InsertDocumentSchema, SelectDocumentSchema,
  // From your existing system
  SelectUserSchema, SelectAssetSchema,
} from "../database-schema";
import { pagination } from './utils';

const c = initContract();

/* -------------------- Extended (hydrated) response shapes -------------------- */
// Dates as strings for responses (your pattern)
const DateString = z.string();

export const ExtendedSelectContactSchema = SelectContactSchema.extend({
  customerProfile: SelectCustomerSchema.optional(),
  ownerProfile: SelectOwnerSchema.optional(),
});

export const ExtendedSelectInquirySchema = SelectInquirySchema
  .omit({ inquiryDate: true, followUpDate: true })
  .extend({
    contact: SelectContactSchema,
    asset: SelectAssetSchema,
    assignee: SelectUserSchema.omit({ roles: true }),
    inquiryDate: DateString,
    followUpDate: DateString.optional().nullable(),
  });

export const ExtendedSelectCommunicationSchema = SelectCommunicationLogSchema
  .omit({ date: true })
  .extend({
    contact: SelectContactSchema,
    user: SelectUserSchema.omit({ roles: true }),
    date: DateString,
  });

export const ExtendedSelectFeedbackSchema = SelectFeedbackSchema
  .omit({ viewingDate: true })
  .extend({
    contact: SelectContactSchema,
    asset: SelectAssetSchema,
    viewingDate: DateString,
  });

export const ExtendedSelectDocumentSchema = SelectDocumentSchema
  .omit({ uploadedAt: true })
  .extend({
    contact: SelectContactSchema,
    uploader: SelectUserSchema.omit({ roles: true }),
    uploadedAt: DateString,
  });

export const ExtendedSelectTaskSchema = SelectTaskSchema
  .omit({ dueDate: true })
  .extend({
    assignee: SelectUserSchema.omit({ roles: true }),
    contact: SelectContactSchema.optional(),
    dueDate: DateString,
  });

export const ExtendedSelectBrochureSchema = SelectBrochureSchema.extend({
  assets: z.array(SelectAssetSchema),
});

export const ExtendedSelectBrochureAssetSchema = SelectBrochureAssetSchema.extend({
  asset: SelectAssetSchema,
});

/* --------------------------------- Contacts --------------------------------- */
export const contactContract = c.router({
  createContact: {
    method: "POST",
    path: "/contact",
    summary: "Create a new contact",
    body: InsertContactSchema.omit({ tenantId: true }),
    responses: {
      201: z.object({ message: z.string(), contactId: z.number() }),
      400: z.object({ message: z.string() }),
    },
  },
  listContacts: {
    method: "GET",
    path: "/contact",
    summary: "List contacts",
    query: z.object({
      search: z.string().optional(),
      hasCustomer: z.coerce.boolean().optional(),
      hasOwner: z.coerce.boolean().optional(),
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(ExtendedSelectContactSchema),
        pagination
      }),
    },
  },
  getContact: {
    method: "GET",
    path: "/contact/:id",
    summary: "Get a contact by id",
    pathParams: z.object({ id: z.coerce.number()}),
    responses: {
      200: ExtendedSelectContactSchema,
      404: z.undefined(),
    },
  },
  updateContact: {
    method: "PUT",
    path: "/contact/:id",
    summary: "Update a contact by id",
    pathParams: z.object({ id: z.coerce.number() }),
    body: UpdateContactSchema.omit({ tenantId: true,id: true }),
    responses: {
      200: z.object({ message: z.string() }),
    },
  },
  deleteContact: {
    method: "DELETE",
    path: "/contact/:id",
    summary: "Delete a contact by id",
    pathParams: z.object({ id: z.coerce.number() }),
    body: z.object({}).optional(),
    responses: { 204: z.undefined() },
  },
  mergeContacts: {
    method: "POST",
    path: "/contact/:id/merge",
    summary: "Merge another contact into this one",
    pathParams: z.object({ id: z.string() }), // target
    body: z.object({ sourceContactId: z.coerce.number() }), // moves data then deletes source
    responses: {
      200: z.object({ message: z.string(), mergedFrom: z.number(), mergedInto: z.number() }),
      400: z.object({ message: z.string() }),
    },
  },
  attachUser: {
    method: "POST",
    path: "/contact/:id/attach-user",
    summary: "Attach an existing User to a Contact",
    pathParams: z.object({ id: z.string() }),
    body: z.object({ userId: z.string() }),
    responses: { 200: z.object({ message: z.string() }) },
  },
  detachUser: {
    method: "POST",
    path: "/contact/:id/detach-user",
    summary: "Detach the linked User (sets userId null)",
    pathParams: z.object({ id: z.string() }),
    body: z.object({}).optional(),
    responses: { 200: z.object({ message: z.string() }) },
  },
});

/* ------------------------------- Profiles ----------------------------------- */
export const profileContract = c.router({
  upsertCustomerProfile: {
    method: "PUT",
    path: "/contact/:id/customer",
    summary: "Create or update a customer profile for a contact",
    pathParams: z.object({ id: z.string() }), // contact id
    body: InsertCustomerSchema.partial().required({ tenantId: true, contactId: true }),
    responses: { 200: z.object({ message: z.string(), customerId: z.number() }) },
  },
  getCustomerProfile: {
    method: "GET",
    path: "/contact/:id/customer",
    summary: "Get a contact's customer profile",
    pathParams: z.object({ id: z.string() }),
    responses: { 200: SelectCustomerSchema, 404: z.undefined() },
  },
  deleteCustomerProfile: {
    method: "DELETE",
    path: "/contact/:id/customer",
    summary: "Delete a contact's customer profile",
    pathParams: z.object({ id: z.string() }),
    body: z.object({}).optional(),
    responses: { 204: z.undefined() },
  },

  upsertOwnerProfile: {
    method: "PUT",
    path: "/contact/:id/owner",
    summary: "Create or update an owner profile for a contact",
    pathParams: z.object({ id: z.string() }),
    body: InsertOwnerSchema.partial().required({ tenantId: true, contactId: true }),
    responses: { 200: z.object({ message: z.string(), ownerId: z.number() }) },
  },
  getOwnerProfile: {
    method: "GET",
    path: "/contact/:id/owner",
    summary: "Get a contact's owner profile",
    pathParams: z.object({ id: z.string() }),
    responses: { 200: SelectOwnerSchema, 404: z.undefined() },
  },
  deleteOwnerProfile: {
    method: "DELETE",
    path: "/contact/:id/owner",
    summary: "Delete a contact's owner profile",
    pathParams: z.object({ id: z.string() }),
    body: z.object({}).optional(),
    responses: { 204: z.undefined() },
  },
});

/* -------------------------------- Inquiries --------------------------------- */
export const inquiryContract = c.router({
  createInquiry: {
    method: "POST",
    path: "/inquiry",
    summary: "Create a new inquiry",
    body: InsertInquirySchema.omit({ tenantId: true, contactId: true, inquiryDate: true, followUpDate: true }).extend({
      contactId: z.number(),
      inquiryDate: z.string(),
      followUpDate: z.string().optional(),
    }),
    responses: { 201: z.object({ message: z.string(), inquiryId: z.number() }) },
  },
  listInquiries: {
    method: "GET",
    path: "/inquiry",
    summary: "List inquiries",
    query: z.object({
      contactId: z.string().optional(),
      assetId: z.string().optional(),
      status: z.enum(["New", "Follow-Up", "Closed"]).optional(),
      assignedTo: z.string().optional(),
      search: z.string().optional(),
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(ExtendedSelectInquirySchema),
        pagination
      })
    },
  },
  getInquiry: {
    method: "GET",
    path: "/inquiry/:id",
    summary: "Get an inquiry by id",
    pathParams: z.object({ id: z.coerce.number() }),
    responses: { 200: ExtendedSelectInquirySchema, 404: z.undefined() },
  },
  updateInquiry: {
    method: "PUT",
    path: "/inquiry/:id",
    summary: "Update an inquiry by id",
    pathParams: z.object({ id: z.coerce.number() }),
    body: UpdateInquirySchema.omit({ tenantId: true, id: true, inquiryDate: true, followUpDate: true }).extend({
      contactId: z.number(),
      inquiryDate: z.string().optional(),
      followUpDate: z.string().optional(),
    }),
    responses: { 200: z.object({ message: z.string() }) },
  },
  deleteInquiry: {
    method: "DELETE",
    path: "/inquiry/:id",
    summary: "Delete an inquiry by id",
    pathParams: z.object({ id: z.coerce.number() }),
    body: z.object({}).optional(),
    responses: { 204: z.undefined() },
  },
  assignInquiry: {
    method: "POST",
    path: "/inquiry/:id/assign",
    summary: "Assign an inquiry to a user",
    pathParams: z.object({ id: z.coerce.number() }),
    body: z.object({ assignedTo: z.string() }),
    responses: { 200: z.object({ message: z.string() }) },
  },
});

/* --------------------------- Communication Log ------------------------------ */
export const commsContract = c.router({
  createComm: {
    method: "POST",
    path: "/communication",
    summary: "Create a communication log",
    body: InsertCommunicationLogSchema.omit({ tenantId: true }),
    responses: { 201: z.object({ message: z.string(), communicationId: z.number() }) },
  },
  listComms: {
    method: "GET",
    path: "/communication",
    summary: "List communications",
    query: z.object({
      contactId: z.string().optional(),
      userId: z.string().optional(),
      type: z.enum(["Email", "Phone Call", "Meeting"]).optional(),
      from: DateString.optional(),
      to: DateString.optional(),
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(SelectCommunicationLogSchema),
        pagination
      })
    },
  },
  getComm: {
    method: "GET",
    path: "/communication/:id",
    summary: "Get a communication by id",
    pathParams: z.object({ id: z.coerce.number() }),
    responses: { 200: ExtendedSelectCommunicationSchema, 404: z.undefined() },
  },
  updateComm: {
    method: "PUT",
    path: "/communication/:id",
    summary: "Update a communication by id",
    pathParams: z.object({ id: z.coerce.number() }),
    body: UpdateCommunicationLogSchema,
    responses: { 200: z.object({ message: z.string() }) },
  },
  deleteComm: {
    method: "DELETE",
    path: "/communication/:id",
    summary: "Delete a communication by id",
    pathParams: z.object({ id: z.coerce.number() }),
    body: z.object({}).optional(),
    responses: { 204: z.undefined() },
  },
});

/* -------------------------------- Feedback ---------------------------------- */
export const feedbackContract = c.router({
  createFeedback: {
    method: "POST",
    path: "/feedback",
    summary: "Create feedback",
    body: InsertFeedbackSchema,
    responses: { 201: z.object({ message: z.string(), feedbackId: z.number() }) },
  },
  listFeedback: {
    method: "GET",
    path: "/feedback",
    summary: "List feedback",
    query: z.object({
      contactId: z.string().optional(),
      assetId: z.string().optional(),
      minRating: z.number().int().min(1).max(5).optional(),
      maxRating: z.number().int().min(1).max(5).optional(),
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(SelectFeedbackSchema),
        pagination
      })
    },
  },
  getFeedback: {
    method: "GET",
    path: "/feedback/:id",
    summary: "Get feedback by id",
    pathParams: z.object({ id: z.coerce.number() }),
    responses: { 200: ExtendedSelectFeedbackSchema, 404: z.undefined() },
  },
  updateFeedback: {
    method: "PUT",
    path: "/feedback/:id",
    summary: "Update feedback by id",
    pathParams: z.object({ id: z.coerce.number() }),
    body: UpdateFeedbackSchema,
    responses: { 200: z.object({ message: z.string() }) },
  },
  deleteFeedback: {
    method: "DELETE",
    path: "/feedback/:id",
    summary: "Delete feedback by id",
    pathParams: z.object({ id: z.coerce.number() }),
    body: z.object({}).optional(),
    responses: { 204: z.undefined() },
  },
});

/* -------------------------------- Brochures --------------------------------- */
export const brochureContract = c.router({
  createBrochure: {
    method: "POST",
    path: "/brochure",
    summary: "Create a brochure for a contact",
    body: InsertBrochureSchema.omit({ tenantId: true }),
    responses: { 201: z.object({ message: z.string(), brochureId: z.number() }) },
  },
  listBrochures: {
    method: "GET",
    path: "/brochure",
    summary: "List brochures",
    query: z.object({
      contactId: z.string().optional(),
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(ExtendedSelectBrochureSchema),
        pagination
      })
    },
  },
  getBrochure: {
    method: "GET",
    path: "/brochure/:id",
    summary: "Get a brochure by id",
    pathParams: z.object({ id: z.coerce.number() }),
    responses: { 200: ExtendedSelectBrochureSchema, 404: z.undefined() },
  },
  deleteBrochure: {
    method: "DELETE",
    path: "/brochure/:id",
    summary: "Delete a brochure by id",
    pathParams: z.object({ id: z.coerce.number() }),
    body: z.object({}).optional(),
    responses: { 204: z.undefined() },
  },

  addBrochureAssets: {
    method: "POST",
    path: "/brochure/:id/assets",
    summary: "Add assets to a brochure",
    pathParams: z.object({ id: z.coerce.number() }),
    body: z.object({ assetIds: z.array(z.string()).min(1) }),
    responses: { 200: z.object({ message: z.string(), added: z.number() }) },
  },
  removeBrochureAsset: {
    method: "DELETE",
    path: "/brochure/:id/assets/:assetId",
    summary: "Remove asset from a brochure",
    pathParams: z.object({ id: z.coerce.number(), assetId: z.string() }),
    body: z.object({}).optional(),
    responses: { 204: z.undefined() },
  },
  listBrochureAssets: {
    method: "GET",
    path: "/brochure/:id/assets",
    summary: "List brochure assets",
    pathParams: z.object({ id: z.coerce.number() }),
    query: z.object({
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(ExtendedSelectBrochureAssetSchema),
        pagination
      })
    },
  },
});

/* ---------------------------------- Tasks ----------------------------------- */
export const taskContract = c.router({
  createTask: {
    method: "POST",
    path: "/task",
    summary: "Create a task",
    body: InsertTaskSchema.omit({  dueDate: true }).extend({
      dueDate: z.string(),
    }),
    responses: { 201: z.object({ message: z.string(), taskId: z.coerce.number() }) },
  },
  listTasks: {
    method: "GET",
    path: "/task",
    summary: "List tasks",
    query: z.object({
      userId: z.string().optional(),
      contactId: z.string().optional(),
      status: z.enum(["Pending", "Completed", "Overdue"]).optional(),
      from: DateString.optional(),
      to: DateString.optional(),
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(SelectTaskSchema),
        pagination
      })
    },
  },
  getTask: {
    method: "GET",
    path: "/task/:id",
    summary: "Get a task by id",
    pathParams: z.object({ id: z.coerce.number() }),
    responses: { 200: ExtendedSelectTaskSchema, 404: z.undefined() },
  },
  updateTask: {
    method: "PUT",
    path: "/task/:id",
    summary: "Update a task by id",
    pathParams: z.object({ id: z.coerce.number() }),
    body: UpdateTaskSchema.omit({ dueDate: true, id: true }).extend({
      dueDate: z.string().optional(),
    }),
    responses: { 200: z.object({ message: z.string() }) },
  },
  deleteTask: {
    method: "DELETE",
    path: "/task/:id",
    summary: "Delete a task by id",
    pathParams: z.object({ id: z.coerce.number() }),
    body: z.object({}).optional(),
    responses: { 204: z.undefined() },
  },
  completeTask: {
    method: "POST",
    path: "/task/:id/complete",
    summary: "Mark task as completed",
    pathParams: z.object({ id: z.coerce.number() }),
    body: z.object({}).optional(),
    responses: { 200: z.object({ message: z.string() }) },
  },
});

/* -------------------------------- Documents --------------------------------- */
export const documentContract = c.router({
  createDocument: {
    method: "POST",
    path: "/document",
    summary: "Create (record) a document for a contact",
    body: InsertDocumentSchema.omit({ tenantId: true }),
    responses: { 201: z.object({ message: z.string(), documentId: z.number() }) },
  },
  listDocuments: {
    method: "GET",
    path: "/document",
    summary: "List documents",
    query: z.object({
      contactId: z.string().optional(),
      documentType: z.enum(["Contract", "Brochure", "Feedback Form", "Other"]).optional(),
      uploadedBy: z.string().optional(),
      from: DateString.optional(),
      to: DateString.optional(),
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(ExtendedSelectDocumentSchema),
        pagination
      })
    },
  },
  getDocument: {
    method: "GET",
    path: "/document/:id",
    summary: "Get a document by id",
    pathParams: z.object({ id: z.coerce.number() }),
    responses: { 200: ExtendedSelectDocumentSchema, 404: z.undefined() },
  },
  deleteDocument: {
    method: "DELETE",
    path: "/document/:id",
    summary: "Delete a document by id",
    pathParams: z.object({ id: z.coerce.number() }),
    body: z.object({}).optional(),
    responses: { 204: z.undefined() },
  },
});

/* ------------------------------- Root (optional) ---------------------------- */
// If you like mounting a single router:
export const crmContract = c.router({
  contacts: contactContract,
  profiles: profileContract,
  inquiries: inquiryContract,
  communications: commsContract,
  feedback: feedbackContract,
  brochures: brochureContract,
  tasks: taskContract,
  documents: documentContract,
});
