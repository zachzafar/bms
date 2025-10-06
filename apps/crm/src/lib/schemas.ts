import { z } from 'zod'

// CRM-specific form schemas that extend the API contract schemas
export const ContactFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Valid email is required' }),
  phone: z.string().optional(),
  address: z.string().optional(),
  source: z.enum(['Website', 'Referral', 'Walk-In', 'Social', 'Other']).default('Website'),
})

export const InquiryFormSchema = z.object({
  contactId: z.number(),
  assetId: z.string(),
  inquiryDate: z.string(),
  status: z.enum(["New", "Follow-Up", "Closed"]),
  followUpDate: z.string().optional(),
  assignedTo: z.string(),
  notes: z.string().optional(),
});

export const CommunicationFormSchema = z.object({
  contactId: z.number({ message: 'Contact is required' }),
  type: z.enum(['Email', 'Phone Call', 'Meeting']),
  summary: z.string().min(1, { message: 'Summary is required' }),
  date: z.date({ message: 'Date is required' }),
})

export const FeedbackFormSchema = z.object({
  contactId: z.number({ message: 'Contact is required' }),
  assetId: z.string({ message: 'Asset is required' }),
  viewingDate: z.date({ message: 'Viewing date is required' }),
  comments: z.string().optional(),
  rating: z.number().int().min(1).max(5, { message: 'Rating must be between 1 and 5' }),
})

export const TaskFormSchema = z.object({
  userId: z.string({ message: 'Assignee is required' }),
  contactId: z.number().optional(),
  description: z.string().min(1, { message: 'Description is required' }),
  dueDate: z.date({ message: 'Due date is required' }),
  status: z.enum(['Pending', 'Completed', 'Overdue']).default('Pending'),
})

export const BrochureFormSchema = z.object({
  contactId: z.number({ message: 'Contact is required' }),
  assetIds: z.array(z.string()).min(1, { message: 'At least one asset is required' }),
})

export const DocumentFormSchema = z.object({
  contactId: z.number({ message: 'Contact is required' }),
  documentType: z.enum(['Contract', 'Brochure', 'Feedback Form', 'Other']).default('Other'),
  filePath: z.string({ message: 'File path is required' }),
  uploadedBy: z.string({ message: 'Uploader is required' }),
})

// Type exports
export type ContactFormInputs = z.infer<typeof ContactFormSchema>
export type InquiryFormInputs = z.infer<typeof InquiryFormSchema>
export type CommunicationFormInputs = z.infer<typeof CommunicationFormSchema>
export type FeedbackFormInputs = z.infer<typeof FeedbackFormSchema>
export type TaskFormInputs = z.infer<typeof TaskFormSchema>
export type BrochureFormInputs = z.infer<typeof BrochureFormSchema>
export type DocumentFormInputs = z.infer<typeof DocumentFormSchema>


