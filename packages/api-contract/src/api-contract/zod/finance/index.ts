import{ z }from "zod";

export const SelectInvoiceSchema = z.object({
    id: z.number(),
    invoiceNumber: z.string(),
    status: z.string(),
    issueDate: z.date(),
    subtotal: z.string(), // decimal
    taxAmount: z.string(),
    totalAmount: z.string(),
    notes: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
    customerId: z.number(), // bigint
    bookingId: z.string(),
    dueDate: z.string(),
});
export const InsertInvoiceSchema = z.object({
    id: z.number().optional(),
    invoiceNumber: z.string(),
    status: z.string(),
    issueDate: z.date(),
    dueDate: z.date(),
    subtotal: z.string(), // decimal
    taxAmount: z.string(),
    totalAmount: z.string(),
    notes: z.string().nullable().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
    customerId: z.number(),
    bookingId: z.string(),
});
export const UpdateInvoiceSchema = InsertInvoiceSchema.partial();

export type InsertInvoice = z.infer<typeof InsertInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>;
export type SelectInvoice = z.infer<typeof SelectInvoiceSchema>;

export const SelectInvoiceItemSchema = z.object({
    id: z.number(),
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.string(),
    totalPrice: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
    invoiceId: z.number(),
});
export const InsertInvoiceItemSchema = z.object({
    id: z.number().optional(),
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.string(),
    totalPrice: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
    invoiceId: z.number(),
});
export const UpdateInvoiceItemSchema = InsertInvoiceItemSchema.partial();

export type InsertInvoiceItem = z.infer<typeof InsertInvoiceItemSchema>;
export type UpdateInvoiceItem = z.infer<typeof UpdateInvoiceItemSchema>;
export type SelectInvoiceItem = z.infer<typeof SelectInvoiceItemSchema>;

export const SelectPaymentInvoiceSchema = z.object({
    id: z.number(),
    paymentId: z.number(),
    invoiceId: z.number(),
    amountApplied: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});
export const InsertPaymentInvoiceSchema = z.object({
    id: z.number().optional(),
    paymentId: z.number(),
    invoiceId: z.number(),
    amountApplied: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
});
export const UpdatePaymentInvoiceSchema = InsertPaymentInvoiceSchema.partial();

export type InsertPaymentInvoice = z.infer<typeof InsertPaymentInvoiceSchema>;
export type UpdatePaymentInvoice = z.infer<typeof UpdatePaymentInvoiceSchema>;
export type SelectPaymentInvoice = z.infer<typeof SelectPaymentInvoiceSchema>;

export const SelectPaymentSchema = z.object({
    id: z.number(),
    amount: z.string(),
    type: z.string(),
    status: z.string(),
    tenantId: z.string(),
    paymentMethod: z.string(),
    reference: z.string().nullable(),
    notes: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
    paymentDate: z.string(),
    customerId: z.number(),
});
export const InsertPaymentSchema = z.object({
    id: z.number().optional(),
    amount: z.string(),
    type: z.string(),
    status: z.string(),
    tenantId: z.string(),
    paymentMethod: z.string(),
    reference: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
    customerId: z.number(),
    paymentDate: z.string(),
});
export const UpdatePaymentSchema = InsertPaymentSchema.partial();

export type InsertPayment = z.infer<typeof InsertPaymentSchema>;
export type UpdatePayment = z.infer<typeof UpdatePaymentSchema>;
export type SelectPayment = z.infer<typeof SelectPaymentSchema>;
