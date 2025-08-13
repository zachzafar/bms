import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { SelectInvoiceSchema, InsertInvoiceSchema, UpdateInvoiceSchema, SelectPaymentSchema, InsertPaymentSchema } from "../database-schema";

const c = initContract();

// Extended schema for invoice with items
const ExtendedInvoiceSchema = SelectInvoiceSchema.extend({
  items: z.array(z.object({
    id: z.number(),
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.string(),
    totalPrice: z.string(),
  })),
});

export const billingContract = c.router({
  // Invoice endpoints
  createInvoice: {
    method: "POST",
    path: "/invoice",
    summary: "Create a new invoice",
    body: z.object({
      invoice: InsertInvoiceSchema,
      items: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
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
      customerId: z.string().optional(),
      bookingId: z.string().optional(),
      status: z.string().optional(),
    }),
    responses: {
      200: z.array(ExtendedInvoiceSchema),
    },
  },

  getInvoice: {
    method: "GET",
    path: "/invoice/:id",
    summary: "Get an invoice by ID",
    pathParams: z.object({
      id: z.string(),
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
      id: z.string(),
    }),
    body: UpdateInvoiceSchema,
    responses: {
      200: z.object({
        message: z.string(),
      }),
      400: z.object({
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
      payment: InsertPaymentSchema,
      invoiceIds: z.array(z.number()),
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
      customerId: z.string().optional(),
    }),
    responses: {
      200: z.array(SelectPaymentSchema),
    },
  },

  getPayment: {
    method: "GET",
    path: "/payment/:id",
    summary: "Get a payment by ID",
    pathParams: z.object({
      id: z.string(),
    }),
    responses: {
      200: SelectPaymentSchema.extend({
        invoices: z.array(z.object({
          invoiceId: z.number(),
          amountApplied: z.string(),
          invoiceNumber: z.string(),
        })),
      }),
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