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


