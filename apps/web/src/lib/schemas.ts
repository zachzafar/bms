import { z } from 'zod'


export const PropertySchema = z.object({
    name: z.string().min(1, { message: 'Asset type name is required' }),
    type: z.enum(['text', 'number', 'list', 'truthy', 'date', 'textarea'], { message: 'Type must be "text", "number", "array", or "boolean"' })
})

export type PropertyInputs = z.infer<typeof PropertySchema>;

export const CategorySchema = z.object({
    name: z.string().min(1, { message: 'Asset type name is required' }),
    schema: z.array(
        z.object({
            propertyId: z.number({ message: 'property required' }),
            isRequired: z.boolean(),
        })
    ).min(1, { message: 'At least one field is required in the schema' })
})

export const AssetTypeSchema = z.object({
    name: z.string().min(1, { message: 'Asset type name is required' }),
    schema: z.array(
        z.object({

            propertyId: z.number({ message: 'property required' }),
            isRequired: z.boolean(),
        })
    ).min(1, { message: 'At least one field is required in the schema' }),
});

export type AssetTypeSchemaInputs = z.infer<typeof AssetTypeSchema>;
export type AsseTypeSchemaInputsAndId = AssetTypeSchemaInputs & { id: string };

export const AssetSchema = z.object({
    name: z.string().min(1, 'Asset name is required'),  // Name is required
    description: z.string().nullable(),  // Optional text description
    status: z.enum(['Available', 'In Use', 'Maintenance']),  // Restrict status to predefined values
    requiresApproval: z.boolean().default(false),  // Boolean with default value

    // Foreign keys for relationships
    assetTypeId: z.string().uuid(),  // UUID of the related AssetType
    assetSubGroupId: z.string().uuid().nullable(),  // UUID of the related AssetSubGroup, optional
    groupId: z.string().uuid().nullable(),  // UUID of the related Group, optional
    ownerId: z.string().uuid().nullable(),  // UUID of the related Owner, optional
});

export type AssetSchemaInputs = z.infer<typeof AssetSchema>



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


