import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { SelectInvoiceSchema, InsertInvoiceSchema, UpdateInvoiceSchema, SelectPaymentSchema, InsertPaymentSchema, InsertPaymentMethodSchema, SelectPaymentMethodSchema } from "../database-schema";
import { pagination } from "./utils";

const c = initContract();

// Credit note schema (used inline in invoice responses)
const CreditNoteSchema = z.object({
  id: z.number(),
  creditNoteNumber: z.string(),
  amount: z.string(),
  reason: z.string().nullable(),
  status: z.string(),
  createdAt: z.date(),
});

// Extended schema for invoice with items and credit notes
const ExtendedInvoiceSchema = SelectInvoiceSchema.extend({
  id: z.number(),
  customerId: z.number().nullable(),
  items: z.array(z.object({
    id: z.number(),
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.string(),
    totalPrice: z.string(),
    invoiceId: z.number(),
  })),
  creditNotes: z.array(CreditNoteSchema).optional(),
});

// Extended schema for payment with invoices
const ExtendedPaymentSchema = SelectPaymentSchema.extend({
  id: z.number(),
  customerId: z.number().nullable(),
  invoices: z.array(z.object({
    invoiceId: z.number(),
    amountApplied: z.string(),
    invoiceNumber: z.string(),
  })),
});

// Extended schema for payment list (without invoices)
const ExtendedPaymentListSchema = SelectPaymentSchema.extend({
  id: z.number(),
  customerId: z.number().nullable(),
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
  body: z.object({}).optional(),
  responses: {
    200: z.object({
      message: z.string(),
    }),
    400: z.object({
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

  deletePayment: {
    method: "DELETE",
    path: "/payment/:id",
    summary: "Delete a payment by ID",
    pathParams: z.object({
      id: z.coerce.number(),
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

  createPaymentMethod: {
        method: "POST",
        path: "/payment-methods",
        body: InsertPaymentMethodSchema.omit({ tenantId: true, id: true, createdAt: true, updatedAt: true, deletedAt: true }),
        responses: {
            200: z.object({
                id: z.number(),
            }),
        },
        summary: "Create a new payment method"
    },
    getPaymentMethods: {
        method: "GET",
        path: "/payment-methods",
        responses: {
            200: z.object({
                data: z.array(SelectPaymentMethodSchema),
                pagination
            }),
        },
        query: z.object({
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
        }),
        summary: "Get all payment methods"
    },
    getPaymentMethod: {
        method: "GET",
        path: "/payment-methods/:id",
        responses: {
            200: SelectPaymentMethodSchema,
            404: z.object({ message: z.string() }),
        },
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: "Get a payment method by ID"
    },
    updatePaymentMethod: {
        method: "PUT",
        path: "/payment-methods/:id",
        body: InsertPaymentMethodSchema.omit({ tenantId: true, id: true, createdAt: true, updatedAt: true, deletedAt: true }).partial(),
        responses: {
            200: z.object({
                message: z.string(),
            }),
        },
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: "Update a payment method"
    },
    deletePaymentMethod: {
        method: "DELETE",
        path: "/payment-methods/:id",
        responses: {
            200: z.object({
                message: z.string(),
            }),
        },
        body: z.object({}).optional(),
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: "Delete a payment method"
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

  // PDF Downloads
  downloadInvoicePdf: {
    method: "GET",
    path: "/invoice/:id/pdf",
    summary: "Download invoice as PDF",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    responses: {
      200: z.any(), // PDF binary response
      404: z.object({
        message: z.string(),
      }),
    },
  },

  downloadPaymentReceiptPdf: {
    method: "GET",
    path: "/payment/:id/pdf",
    summary: "Download payment receipt as PDF",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    responses: {
      200: z.any(), // PDF binary response
      404: z.object({
        message: z.string(),
      }),
    },
  },

  // Get payments for an invoice
  getInvoicePayments: {
    method: "GET",
    path: "/invoice/:id/payments",
    summary: "Get all payments applied to an invoice",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    responses: {
      200: z.array(z.object({
        paymentId: z.number(),
        amountApplied: z.string(),
        paymentDate: z.string(),
        paymentMethod: z.string(),
        reference: z.string().nullable(),
      })),
      404: z.object({
        message: z.string(),
      }),
    },
  },

  // Approve a draft invoice (locks it for payment)
  approveInvoice: {
    method: "POST",
    path: "/invoice/:id/approve",
    summary: "Approve a draft invoice, locking it from further edits",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    body: z.object({}),
    responses: {
      200: z.object({ message: z.string() }),
      400: z.object({ message: z.string() }),
      404: z.object({ message: z.string() }),
    },
  },

  // Create a credit note against an invoice
  createCreditNote: {
    method: "POST",
    path: "/invoice/:id/credit-note",
    summary: "Issue a credit note against an approved invoice",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    body: z.object({
      amount: z.string(),
      reason: z.string().optional(),
    }),
    responses: {
      201: z.object({ message: z.string(), creditNoteId: z.number() }),
      400: z.object({ message: z.string() }),
      404: z.object({ message: z.string() }),
    },
  },

  // Get credit notes for an invoice
  getCreditNotes: {
    method: "GET",
    path: "/invoice/:id/credit-notes",
    summary: "Get all credit notes for an invoice",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    responses: {
      200: z.array(CreditNoteSchema),
      404: z.object({ message: z.string() }),
    },
  },

  // Delete a draft credit note
  deleteCreditNote: {
    method: "DELETE",
    path: "/credit-note/:id",
    summary: "Delete a draft credit note",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    body: z.object({}),
    responses: {
      200: z.object({ message: z.string() }),
      400: z.object({ message: z.string() }),
      404: z.object({ message: z.string() }),
    },
  },

  // Owner portal — read-only billing views
  getOwnerInvoices: {
    method: 'GET',
    path: '/owner/invoices',
    summary: 'Get invoices for the authenticated owner\'s assets',
    query: z.object({
      status: z.string().optional(),
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(ExtendedInvoiceSchema),
        pagination,
      }),
    },
  },

  getOwnerPayments: {
    method: 'GET',
    path: '/owner/payments',
    summary: 'Get payments for the authenticated owner\'s assets',
    query: z.object({
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(ExtendedPaymentListSchema),
        pagination,
      }),
    },
  },
});