import { relations } from "drizzle-orm/relations";
import { assetType, asset, group, owner, tenant, assetHasProperties, assetProperty, bookingForm, assetTypeHasProperties, availability, booking, customer, bookingFormField, bookingFormFieldValue, category, user, file, maintenanceTask, groupType, refreshTokens, tenantHasUsers } from "./schema";

export const assetRelations = relations(asset, ({one, many}) => ({
	assetType: one(assetType, {
		fields: [asset.assetTypeId],
		references: [assetType.id]
	}),
	group: one(group, {
		fields: [asset.groupId],
		references: [group.id]
	}),
	owner: one(owner, {
		fields: [asset.ownerId],
		references: [owner.id]
	}),
	tenant: one(tenant, {
		fields: [asset.tenantId],
		references: [tenant.id]
	}),
	assetHasProperties: many(assetHasProperties),
	availabilities: many(availability),
	bookings: many(booking),
	files: many(file),
	maintenanceTasks: many(maintenanceTask),
}));

export const assetTypeRelations = relations(assetType, ({one, many}) => ({
	assets: many(asset),
	bookingForm: one(bookingForm, {
		fields: [assetType.bookingFormId],
		references: [bookingForm.id]
	}),
	assetTypeHasProperties: many(assetTypeHasProperties),
	categories: many(category),
}));

export const groupRelations = relations(group, ({one, many}) => ({
	assets: many(asset),
	groupType: one(groupType, {
		fields: [group.groupTypeId],
		references: [groupType.id]
	}),
}));

export const ownerRelations = relations(owner, ({one, many}) => ({
	assets: many(asset),
	user: one(user, {
		fields: [owner.userId],
		references: [user.id]
	}),
}));

export const tenantRelations = relations(tenant, ({many}) => ({
	assets: many(asset),
	tenantHasUsers: many(tenantHasUsers),
}));

export const assetHasPropertiesRelations = relations(assetHasProperties, ({one}) => ({
	asset: one(asset, {
		fields: [assetHasProperties.assetId],
		references: [asset.id]
	}),
	assetProperty: one(assetProperty, {
		fields: [assetHasProperties.assetPropertyId],
		references: [assetProperty.id]
	}),
}));

export const assetPropertyRelations = relations(assetProperty, ({many}) => ({
	assetHasProperties: many(assetHasProperties),
	assetTypeHasProperties: many(assetTypeHasProperties),
}));

export const bookingFormRelations = relations(bookingForm, ({many}) => ({
	assetTypes: many(assetType),
	bookingFormFields: many(bookingFormField),
}));

export const assetTypeHasPropertiesRelations = relations(assetTypeHasProperties, ({one}) => ({
	assetProperty: one(assetProperty, {
		fields: [assetTypeHasProperties.assetPropertyId],
		references: [assetProperty.id]
	}),
	assetType: one(assetType, {
		fields: [assetTypeHasProperties.assetTypeId],
		references: [assetType.id]
	}),
}));

export const availabilityRelations = relations(availability, ({one}) => ({
	asset: one(asset, {
		fields: [availability.assetId],
		references: [asset.id]
	}),
}));

export const bookingRelations = relations(booking, ({one, many}) => ({
	asset: one(asset, {
		fields: [booking.assetId],
		references: [asset.id]
	}),
	customer: one(customer, {
		fields: [booking.customerId],
		references: [customer.id]
	}),
	bookingFormFieldValues: many(bookingFormFieldValue),
}));

export const customerRelations = relations(customer, ({one, many}) => ({
	bookings: many(booking),
	user: one(user, {
		fields: [customer.userId],
		references: [user.id]
	}),
}));

export const bookingFormFieldRelations = relations(bookingFormField, ({one, many}) => ({
	bookingForm: one(bookingForm, {
		fields: [bookingFormField.formId],
		references: [bookingForm.id]
	}),
	bookingFormFieldValues: many(bookingFormFieldValue),
}));

export const bookingFormFieldValueRelations = relations(bookingFormFieldValue, ({one}) => ({
	booking: one(booking, {
		fields: [bookingFormFieldValue.bookingId],
		references: [booking.id]
	}),
	bookingFormField: one(bookingFormField, {
		fields: [bookingFormFieldValue.formFieldId],
		references: [bookingFormField.id]
	}),
}));

export const categoryRelations = relations(category, ({one}) => ({
	assetType: one(assetType, {
		fields: [category.assetTypeId],
		references: [assetType.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	customers: many(customer),
	owners: many(owner),
	refreshTokens: many(refreshTokens),
	tenantHasUsers: many(tenantHasUsers),
}));

export const fileRelations = relations(file, ({one}) => ({
	asset: one(asset, {
		fields: [file.assetId],
		references: [asset.id]
	}),
	maintenanceTask: one(maintenanceTask, {
		fields: [file.maintenanceTaskId],
		references: [maintenanceTask.id]
	}),
}));

export const maintenanceTaskRelations = relations(maintenanceTask, ({one, many}) => ({
	files: many(file),
	asset: one(asset, {
		fields: [maintenanceTask.assetId],
		references: [asset.id]
	}),
}));

export const groupTypeRelations = relations(groupType, ({many}) => ({
	groups: many(group),
}));

export const refreshTokensRelations = relations(refreshTokens, ({one}) => ({
	user: one(user, {
		fields: [refreshTokens.userId],
		references: [user.id]
	}),
}));

export const tenantHasUsersRelations = relations(tenantHasUsers, ({one}) => ({
	tenant: one(tenant, {
		fields: [tenantHasUsers.tenantId],
		references: [tenant.id]
	}),
	user: one(user, {
		fields: [tenantHasUsers.userId],
		references: [user.id]
	}),
}));