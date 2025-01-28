import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, foreignKey, primaryKey, unique, serial, varchar, text, bigint, timestamp, int, decimal, datetime, mysqlEnum } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const asset = mysqlTable("asset", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	available: tinyint().default(1).notNull(),
	requiresApproval: tinyint("requires_approval").default(0).notNull(),
	assetTypeId: bigint("asset_type_id", { mode: "number", unsigned: true }).references(() => assetType.id),
	groupId: bigint("group_id", { mode: "number", unsigned: true }).references(() => group.id),
	ownerId: bigint("owner_id", { mode: "number", unsigned: true }).references(() => owner.id),
	tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => tenant.id),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => {
	return {
		typeIdx: index("asset_type_idx").on(table.assetTypeId),
		groupIdx: index("group_idx").on(table.groupId),
		ownerIdx: index("owner_idx").on(table.ownerId),
		assetId: primaryKey({ columns: [table.id], name: "asset_id"}),
		id: unique("id").on(table.id),
	}
});

export const assetHasProperties = mysqlTable("asset_has_properties", {
	id: serial().notNull(),
	assetId: bigint("asset_id", { mode: "number", unsigned: true }).notNull().references(() => asset.id),
	assetPropertyId: bigint("asset_property_id", { mode: "number", unsigned: true }).notNull().references(() => assetProperty.id),
	value: varchar({ length: 255 }).notNull(),
},
(table) => {
	return {
		assetHasPropertiesId: primaryKey({ columns: [table.id], name: "asset_has_properties_id"}),
		id: unique("id").on(table.id),
		assetPropertyUnique: unique("asset_property_unique").on(table.assetId, table.assetPropertyId),
	}
});

export const assetProperty = mysqlTable("asset_property", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	propertyType: varchar("property_type", { length: 255 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }),
},
(table) => {
	return {
		assetPropertyId: primaryKey({ columns: [table.id], name: "asset_property_id"}),
		id: unique("id").on(table.id),
		nameUnique: unique("name_unique").on(table.name),
	}
});

export const assetType = mysqlTable("asset_type", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	bookingFormId: bigint("booking_form_id", { mode: "number", unsigned: true }).references(() => bookingForm.id),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }),
},
(table) => {
	return {
		assetTypeId: primaryKey({ columns: [table.id], name: "asset_type_id"}),
		id: unique("id").on(table.id),
		nameUnique: unique("name_unique").on(table.name),
		bookingFormUnique: unique("booking_form_unique").on(table.bookingFormId),
	}
});

export const assetTypeHasProperties = mysqlTable("asset_type_has_properties", {
	id: serial().notNull(),
	assetTypeId: bigint("asset_type_id", { mode: "number", unsigned: true }).notNull().references(() => assetType.id, { onDelete: "cascade" } ),
	assetPropertyId: bigint("asset_property_id", { mode: "number", unsigned: true }).notNull().references(() => assetProperty.id, { onDelete: "cascade" } ),
	required: tinyint().default(0).notNull(),
},
(table) => {
	return {
		assetTypeHasPropertiesId: primaryKey({ columns: [table.id], name: "asset_type_has_properties_id"}),
		id: unique("id").on(table.id),
		assetTypePropertyUnique: unique("asset_type_property_unique").on(table.assetTypeId, table.assetPropertyId),
	}
});

export const availability = mysqlTable("availability", {
	id: serial().notNull(),
	assetId: bigint("asset_id", { mode: "number", unsigned: true }).notNull().references(() => asset.id),
	date: int().notNull(),
	price: decimal({ precision: 1, scale: 0 }),
	available: tinyint().notNull(),
},
(table) => {
	return {
		assetIdx: index("asset_idx").on(table.assetId),
		availabilityId: primaryKey({ columns: [table.id], name: "availability_id"}),
		id: unique("id").on(table.id),
	}
});

export const booking = mysqlTable("booking", {
	id: serial().notNull(),
	startDate: datetime("start_date", { mode: 'string'}).notNull(),
	endDate: datetime("end_date", { mode: 'string'}).notNull(),
	status: varchar({ length: 255 }).notNull(),
	totalPrice: decimal({ precision: 1, scale: 0 }),
	message: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	assetId: bigint("asset_id", { mode: "number", unsigned: true }).notNull().references(() => asset.id),
	customerId: bigint("customer_id", { mode: "number", unsigned: true }).notNull().references(() => customer.id),
},
(table) => {
	return {
		assetIdx: index("asset_idx").on(table.assetId),
		customerIdx: index("customer_idx").on(table.customerId),
		bookingId: primaryKey({ columns: [table.id], name: "booking_id"}),
		id: unique("id").on(table.id),
	}
});

export const bookingForm = mysqlTable("booking_form", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => {
	return {
		bookingFormId: primaryKey({ columns: [table.id], name: "booking_form_id"}),
		id: unique("id").on(table.id),
	}
});

export const bookingFormField = mysqlTable("booking_form_field", {
	id: serial().notNull(),
	formId: bigint("form_id", { mode: "number", unsigned: true }).notNull().references(() => bookingForm.id),
	name: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	required: tinyint().notNull(),
},
(table) => {
	return {
		formIdx: index("form_idx").on(table.formId),
		bookingFormFieldId: primaryKey({ columns: [table.id], name: "booking_form_field_id"}),
		id: unique("id").on(table.id),
	}
});

export const bookingFormFieldValue = mysqlTable("booking_form_field_value", {
	id: serial().notNull(),
	bookingId: bigint("booking_id", { mode: "number", unsigned: true }).notNull().references(() => booking.id),
	formFieldId: bigint("form_field_id", { mode: "number", unsigned: true }).notNull().references(() => bookingFormField.id),
	value: text().notNull(),
},
(table) => {
	return {
		bookingIdx: index("booking_idx").on(table.bookingId),
		formFieldIdx: index("form_field_idx").on(table.formFieldId),
		bookingFormFieldValueId: primaryKey({ columns: [table.id], name: "booking_form_field_value_id"}),
		id: unique("id").on(table.id),
	}
});

export const category = mysqlTable("category", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	assetTypeId: bigint("asset_type_id", { mode: "number", unsigned: true }).references(() => assetType.id),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => {
	return {
		assetTypeIdx: index("asset_type_idx").on(table.assetTypeId),
		categoryId: primaryKey({ columns: [table.id], name: "category_id"}),
		id: unique("id").on(table.id),
	}
});

export const customer = mysqlTable("customer", {
	id: serial().notNull(),
	firstName: varchar("first_name", { length: 255 }).notNull(),
	lastName: varchar("last_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 255 }),
	address: varchar({ length: 255 }),
	dateOfBirth: datetime("date_of_birth", { mode: 'string'}),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	userId: varchar("user_id", { length: 255 }).notNull().references(() => user.id, { onDelete: "cascade" } ),
},
(table) => {
	return {
		customerId: primaryKey({ columns: [table.id], name: "customer_id"}),
		id: unique("id").on(table.id),
		emailUnique: unique("email_unique").on(table.email),
		userIdUnique: unique("user_id_unique").on(table.userId),
	}
});

export const file = mysqlTable("file", {
	id: serial().notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	fileUrl: varchar("file_url", { length: 255 }).notNull(),
	fileType: varchar("file_type", { length: 255 }).notNull(),
	fileSize: int("file_size").notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	assetId: bigint("asset_id", { mode: "number", unsigned: true }).references(() => asset.id),
	maintenanceTaskId: bigint("maintenance_task_id", { mode: "number", unsigned: true }).references(() => maintenanceTask.id),
},
(table) => {
	return {
		assetIdx: index("asset_idx").on(table.assetId),
		maintenanceTaskIdx: index("maintenance_task_idx").on(table.maintenanceTaskId),
		fileId: primaryKey({ columns: [table.id], name: "file_id"}),
		id: unique("id").on(table.id),
	}
});

export const group = mysqlTable("group", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	groupTypeId: bigint("group_type_id", { mode: "number", unsigned: true }).notNull().references(() => groupType.id),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => {
	return {
		typeIdx: index("group_type_idx").on(table.groupTypeId),
		groupId: primaryKey({ columns: [table.id], name: "group_id"}),
		id: unique("id").on(table.id),
	}
});

export const groupType = mysqlTable("group_type", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }),
},
(table) => {
	return {
		groupTypeId: primaryKey({ columns: [table.id], name: "group_type_id"}),
		id: unique("id").on(table.id),
	}
});

export const maintenanceTask = mysqlTable("maintenance_task", {
	id: serial().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	status: varchar({ length: 255 }).notNull(),
	priority: varchar({ length: 255 }),
	startDate: datetime("start_date", { mode: 'string'}).notNull(),
	endDate: datetime("end_date", { mode: 'string'}),
	assetId: bigint("asset_id", { mode: "number", unsigned: true }).notNull().references(() => asset.id),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => {
	return {
		assetIdx: index("asset_idx").on(table.assetId),
		maintenanceTaskId: primaryKey({ columns: [table.id], name: "maintenance_task_id"}),
		id: unique("id").on(table.id),
	}
});

export const owner = mysqlTable("owner", {
	id: serial().notNull(),
	firstName: varchar("first_name", { length: 255 }).notNull(),
	lastName: varchar("last_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 255 }),
	address: varchar({ length: 255 }),
	companyName: varchar("company_name", { length: 255 }),
	taxId: varchar("tax_id", { length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	userId: varchar("user_id", { length: 255 }).notNull().references(() => user.id, { onDelete: "cascade" } ),
},
(table) => {
	return {
		ownerId: primaryKey({ columns: [table.id], name: "owner_id"}),
		id: unique("id").on(table.id),
		emailUnique: unique("email_unique").on(table.email),
		userIdUnique: unique("user_id_unique").on(table.userId),
	}
});

export const refreshTokens = mysqlTable("refresh_tokens", {
	id: serial().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => user.id),
	hashedToken: varchar("hashed_token", { length: 255 }).notNull(),
	deviceInfo: varchar("device_info", { length: 255 }),
	ipAddress: varchar("ip_address", { length: 45 }),
	revoked: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => {
	return {
		refreshTokensId: primaryKey({ columns: [table.id], name: "refresh_tokens_id"}),
		id: unique("id").on(table.id),
	}
});

export const tenant = mysqlTable("tenant", {
	id: varchar({ length: 36 }).default('uuid()').notNull(),
	name: varchar({ length: 255 }).notNull(),
	subdomain: varchar({ length: 255 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => {
	return {
		tenantId: primaryKey({ columns: [table.id], name: "tenant_id"}),
		subdomainUnique: unique("subdomain_unique").on(table.subdomain),
	}
});

export const tenantHasUsers = mysqlTable("tenant_has_users", {
	id: serial().notNull(),
	tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => tenant.id),
	userId: varchar("user_id", { length: 255 }).notNull().references(() => user.id),
},
(table) => {
	return {
		tenantHasUsersId: primaryKey({ columns: [table.id], name: "tenant_has_users_id"}),
		id: unique("id").on(table.id),
		tenantIdx: unique("tenant_idx").on(table.tenantId, table.userId),
	}
});

export const user = mysqlTable("user", {
	id: varchar({ length: 36 }).default('uuid()').notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	role: mysqlEnum(['ADMIN','SYSADMIN','STAFF','OWNER','CUSTOMER']).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => {
	return {
		userId: primaryKey({ columns: [table.id], name: "user_id"}),
		emailUnique: unique("email_unique").on(table.email),
	}
});
