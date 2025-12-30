import { z } from "zod";

export const InsertUserSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    email: z.string(),
    password: z.string(),
    userType: z.enum(["customer", "owner", "system", "admin"]),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
});
export const SelectUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    password: z.string(),
    userType: z.enum(["customer", "owner", "system", "admin"]),
    createdAt: z.date().nullable(),
    updatedAt: z.date().nullable(),
    roles: z.array(z.number()),
});
export const UpdateUserSchema = InsertUserSchema.partial();

export type InsertUser = z.infer<typeof InsertUserSchema>
export type SelectUser = z.infer<typeof SelectUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>

export const InsertUserHasBookingsSchema = z.object({
    id: z.number().optional(),
    userId: z.string(),
    bookingId: z.string(),
});
export const SelectUserHasBookingsSchema = z.object({
    id: z.number(),
    userId: z.string(),
    bookingId: z.string(),
});

export type InsertUserHasBookings = z.infer<typeof InsertUserHasBookingsSchema>
export type SelectUserHasBookings = z.infer<typeof SelectUserHasBookingsSchema>

export const InsertUserHasAssetsSchema = z.object({
    id: z.number().optional(),
    userId: z.string(),
    assetId: z.string(),
    type: z.enum(["owner", "manager"]).optional(),
});
export const SelectUserHasAssetsSchema = z.object({
    id: z.number(),
    userId: z.string(),
    assetId: z.string(),
    type: z.enum(["owner", "manager"]),
});

export type InsertUserHasAssets = z.infer<typeof InsertUserHasAssetsSchema>
export type SelectUserHasAssets = z.infer<typeof SelectUserHasAssetsSchema>

export const InsertCustomerSchema = z.object({
    id: z.number().optional(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    contactId: z.number().nullable().optional(),
    dateOfBirth: z.date().nullable().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
    tenantId: z.string(),
    userId: z.string(),
});
export const SelectCustomerSchema = z.object({
    id: z.number(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    contactId: z.number().nullable(),
    dateOfBirth: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
    tenantId: z.string(),
    userId: z.string(),
});
export const UpdateCustomerSchema = InsertCustomerSchema.partial().required({ userId: true });

export type InsertCustomer = z.infer<typeof InsertCustomerSchema>;
export type SelectCustomer = z.infer<typeof SelectCustomerSchema>;
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;

export const InsertOwnerSchema = z.object({
    id: z.number().optional(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    companyName: z.string().nullable().optional(),
    contactId: z.number().nullable().optional(),
    taxId: z.string().nullable().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
    tenantId: z.string(),
    userId: z.string(),
});
export const SelectOwnerSchema = z.object({
    id: z.number(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    companyName: z.string().nullable(),
    contactId: z.number().nullable(),
    taxId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
    tenantId: z.string(),
    userId: z.string(),
});
export const UpdateOwnerSchema = InsertOwnerSchema.partial().required({ userId: true });
export type InsertOwner = z.infer<typeof InsertOwnerSchema>;
export type SelectOwner = z.infer<typeof SelectOwnerSchema>;
export type UpdateOwner = z.infer<typeof UpdateOwnerSchema>;

export const InsertRoleSchema = z.object({
    id: z.number().optional(),
    name: z.string(),
    description: z.string().nullable().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
    tenantId: z.string().nullable().optional(),
});
export const SelectRoleSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
    tenantId: z.string().nullable(),
});

export type InsertRole = z.infer<typeof InsertRoleSchema>
export type SelectRole = z.infer<typeof SelectRoleSchema>

export const InsertUserHasRolesSchema = z.object({
    id: z.number().optional(),
    roleId: z.number(),
    userId: z.string(),
    tenantId: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
});
export const SelectUserHasRolesSchema = z.object({
    id: z.number(),
    roleId: z.number(),
    userId: z.string(),
    tenantId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});

export type InsertUserHasRoles = z.infer<typeof InsertUserHasRolesSchema>
export type SelectUserHasRoles = z.infer<typeof SelectUserHasRolesSchema>

export const InsertRoleHasPermissionsSchema = z.object({
    id: z.number().optional(),
    roleId: z.number(),
    permission: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
});
export const SelectRoleHasPermissionsSchema = z.object({
    id: z.number(),
    roleId: z.number(),
    permission: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});

export type InsertRoleHasPermissions = z.infer<typeof InsertRoleHasPermissionsSchema>
export type SelectRoleHasPermissions = z.infer<typeof SelectRoleHasPermissionsSchema>



