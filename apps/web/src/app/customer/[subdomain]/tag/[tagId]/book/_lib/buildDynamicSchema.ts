import { z } from 'zod';

export const BaseCustomerTagBookingSchema = z.object({
  dateRange: z.object({
    from: z.date({ required_error: 'Start date is required' }),
    to: z.date({ required_error: 'End date is required' }),
  }).refine((data) => data.from && data.to, {
    message: 'Please select both start and end dates',
  }),
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().min(10, 'Phone number must be at least 10 characters'),
});

export type CustomerTagBookingFormData = z.infer<typeof BaseCustomerTagBookingSchema> & Record<string, any>;

type FormField = { id: number; name: string; type: string; required: boolean };
type FormWithFields = { form: { id: number }; fields: FormField[] };

function getFieldSchema(field: FormField): z.ZodTypeAny {
  switch (field.type) {
    case 'number':
    case 'range':
      return field.required
        ? z.coerce.number({ required_error: `${field.name} is required`, invalid_type_error: `${field.name} must be a number` })
        : z.coerce.number().optional();
    case 'date_range':
      return field.required
        ? z.object({ start: z.string().min(1, `${field.name} start date is required`), end: z.string().min(1, `${field.name} end date is required`) })
        : z.object({ start: z.string().optional(), end: z.string().optional() }).optional();
    case 'boolean':
      return field.required
        ? z.boolean().refine((val) => val === true, { message: `${field.name} must be checked` })
        : z.boolean().optional();
    default: // text, textarea, time, date
      return field.required
        ? z.string().min(1, `${field.name} is required`)
        : z.string().optional();
  }
}

export function buildDynamicSchema(forms: FormWithFields[]) {
  const dynamicFields: Record<string, z.ZodTypeAny> = {};
  forms.forEach((formData) => {
    formData.fields.forEach((field) => {
      dynamicFields[`form_${formData.form.id}_${field.id}`] = getFieldSchema(field);
    });
  });
  return BaseCustomerTagBookingSchema.extend(dynamicFields);
}
