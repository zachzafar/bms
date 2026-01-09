import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { SelectInvoiceSchema, InsertInvoiceSchema, UpdateInvoiceSchema, SelectPaymentSchema, InsertPaymentSchema } from "../database-schema";
import { pagination } from "./utils";

const c = initContract();

// Extended schema for invoice with items
const ExtendedInvoiceSchema = SelectInvoiceSchema.extend({
  id: z.number(),
  customerId: z.number(),
  items: z.array(z.object({
    id: z.number(),
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.string(),
    totalPrice: z.string(),
    invoiceId: z.number(),
  })),
});

// Extended schema for payment with invoices
const ExtendedPaymentSchema = SelectPaymentSchema.extend({
  id: z.number(),
  customerId: z.number(),
  invoices: z.array(z.object({
    invoiceId: z.number(),
    amountApplied: z.string(),
    invoiceNumber: z.string(),
  })),
});

// Extended schema for payment list (without invoices)
const ExtendedPaymentListSchema = SelectPaymentSchema.extend({
  id: z.number(),
  customerId: z.number(),
});

export const billingContract = c.router({
  // Invoice endpoints
  createInvoice: {
    method: "POST",
    path: "/invoice",
    summary: "Create a new invoice",
    body: z.object({
      invoice: InsertInvoiceSchema.extend({
        customerId: z.coerce.number(), // frontend sends string
        // issueDate and dueDate are handled by schema coercion
      }),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.coerce.number(),
        unitPrice: z.string(),
        totalPrice: z.string(),
      })),
    }),
    responses: {
      201: z.object({
        message: z.string(),
        invoiceId: z.number(),
      }),
      //   400: z.object({
      //     message: z.string(),
      //   }),
    },
  },

  getInvoices: {
    method: "GET",
    path: "/invoice",
    summary: "Get all invoices, optionally filtered by customerId or bookingId",
    query: z.object({
      customerId: z.coerce.number().optional(),
      bookingId: z.string().optional(),
      status: z.string().optional(),
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(ExtendedInvoiceSchema),
        pagination
      })
    },
  },

  getInvoice: {
    method: "GET",
    path: "/invoice/:id",
    summary: "Get an invoice by ID",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    responses: {
      200: ExtendedInvoiceSchema,
      404: z.undefined(),
    },
  },

  updateInvoice: {
  method: "PUT",
  path: "/invoice/:id",
  summary: "Update an invoice by ID",
  pathParams: z.object({
    id: z.coerce.number(),
  }),
  body: UpdateInvoiceSchema.extend({
    customerId: z.coerce.number(), // frontend sends string
    // issueDate and dueDate are handled by schema coercion
    items: z.array(z.object({
      id: z.number(),
      description: z.string(),
      quantity: z.coerce.number(),
      unitPrice: z.string(),
      totalPrice: z.string(),
      invoiceId: z.number(),
    })).optional(), // <-- added
  }),
  responses: {
    200: z.object({
      message: z.string(),
    }),
    400: z.object({
      message: z.string(),
    }),
  },
},

  deleteInvoice: {
  method: "DELETE",
  path: "/invoice/:id",
  summary: "Delete an invoice by ID",
  pathParams: z.object({
    id: z.coerce.number(), // frontend will send the invoice ID as a string
  }),
  body: z.object({}),
  responses: {
    200: z.object({
      message: z.string(),
    }),
    404: z.object({
      message: z.string(),
    }),
  },
},

  // Payment endpoints
  createPayment: {
    method: "POST",
    path: "/payment",
    summary: "Create a new payment",
    body: z.object({
      payment: InsertPaymentSchema.extend({
        customerId: z.coerce.number(), // frontend sends string
        amount: z.string(),
        // paymentDate is handled by schema coercion
      }),
      invoiceIds: z.array(z.coerce.number()),
      amountsApplied: z.array(z.string()),
    }),
    responses: {
      201: z.object({
        message: z.string(),
        paymentId: z.number(),
      }),
      400: z.object({
        message: z.string(),
      }),
    },
  },

  getPayments: {
    method: "GET",
    path: "/payment",
    summary: "Get all payments, optionally filtered by customerId",
    query: z.object({
      customerId: z.coerce.number().optional(),
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(ExtendedPaymentListSchema),
        pagination
      })
    },
  },

  getPayment: {
    method: "GET",
    path: "/payment/:id",
    summary: "Get a payment by ID",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    responses: {
      200: ExtendedPaymentSchema,
      404: z.undefined(),
    },
  },

  // Generate invoice from booking
  generateInvoiceFromBooking: {
    method: "POST",
    path: "/invoice/generate-from-booking/:bookingId",
    summary: "Generate an invoice from a booking",
    pathParams: z.object({
      bookingId: z.string(),
    }),
    body: z.object({}),
    responses: {
      201: z.object({
        message: z.string(),
        invoiceId: z.number(),
      }),
      400: z.object({
        message: z.string(),
      }),
    },
  },
});