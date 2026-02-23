CREATE TABLE `customer_details` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(255),
	`address` varchar(255),
	`customer_type_id` bigint unsigned,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`deleted_at` timestamp,
	`tenant_id` varchar(255) NOT NULL,
	CONSTRAINT `customer_details_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_email_idx` UNIQUE(`tenant_id`,`email`)
);
--> statement-breakpoint
CREATE TABLE `customer_types` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`deleted_at` timestamp,
	`tenant_id` varchar(255) NOT NULL,
	CONSTRAINT `customer_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_type_tenant_name_idx` UNIQUE(`tenant_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `owner_details` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(255),
	`address` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`deleted_at` timestamp,
	`tenant_id` varchar(255) NOT NULL,
	CONSTRAINT `owner_details_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `owner_has_assets` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`owner_id` bigint unsigned NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	CONSTRAINT `owner_has_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_has_permissions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`role_id` bigint unsigned NOT NULL,
	`permission` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `role_has_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`deleted_at` timestamp,
	`tenant_id` varchar(255),
	CONSTRAINT `roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`user_type` enum('system','admin') NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updated_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `user_has_roles` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`roles_id` bigint unsigned NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `user_has_roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_tasks` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`cost` float NOT NULL,
	`description` text NOT NULL,
	`status` enum('COMPLETE','IN_PROGRESS','AWAITING') NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `maintenance_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rate` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`asset_type_id` bigint unsigned,
	`rate_type_id` bigint unsigned,
	`description` text,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`min_duration` int,
	`max_duration` int,
	`price_per_unit` decimal,
	`priority` int DEFAULT 100,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rate_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rate_type` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`minutes` int NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `rate_type_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`available` boolean NOT NULL DEFAULT true,
	`requires_approval` boolean NOT NULL DEFAULT false,
	`asset_type_id` bigint unsigned NOT NULL,
	`user_id` varchar(255),
	`tenant_id` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_has_booking_forms` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	`booking_form_id` bigint unsigned NOT NULL,
	CONSTRAINT `asset_has_booking_forms_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_form_unique` UNIQUE(`asset_id`,`booking_form_id`)
);
--> statement-breakpoint
CREATE TABLE `asset_has_properties` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	`asset_property_id` bigint unsigned NOT NULL,
	`value` text NOT NULL,
	CONSTRAINT `asset_has_properties_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_property_unique` UNIQUE(`asset_id`,`asset_property_id`)
);
--> statement-breakpoint
CREATE TABLE `asset_has_rates` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`rate_id` bigint unsigned NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	CONSTRAINT `asset_has_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_images` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	`file_path` varchar(255) NOT NULL,
	`image_type` enum('primary','secondary','gallery') NOT NULL DEFAULT 'gallery',
	CONSTRAINT `asset_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blocked_date` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`asset_id` varchar(255),
	`start_date` datetime NOT NULL,
	`end_date` datetime NOT NULL,
	`title` varchar(255) NOT NULL,
	`reason` varchar(255),
	`booking_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `blocked_date_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `booking` (
	`id` varchar(36) NOT NULL,
	`customer_id` bigint unsigned,
	`start_date` datetime NOT NULL,
	`end_date` datetime NOT NULL,
	`status` enum('Pending','Confirmed','Cancelled') NOT NULL,
	`totalPrice` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`deleted_at` timestamp,
	`asset_id` varchar(255) NOT NULL,
	CONSTRAINT `booking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `booking_form_field_value` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`booking_id` varchar(255) NOT NULL,
	`form_field_id` bigint unsigned NOT NULL,
	`value` text NOT NULL,
	CONSTRAINT `booking_form_field_value_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `booking_upate_token` (
	`id` varchar(36) NOT NULL,
	`customer_id` bigint unsigned,
	`booking_id` varchar(36),
	`token` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`used_at` timestamp,
	CONSTRAINT `booking_upate_token_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `slots` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	`date` date NOT NULL,
	`start_time` datetime NOT NULL,
	`end_time` datetime NOT NULL,
	`status` varchar(20) NOT NULL,
	`booking_id` varchar(36),
	`price` decimal(10,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_note` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`invoice_id` bigint unsigned NOT NULL,
	`credit_note_number` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`reason` text,
	`cn_status` enum('draft','issued') NOT NULL DEFAULT 'issued',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `credit_note_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`invoice_number` varchar(255) NOT NULL,
	`status` enum('draft','approved','partial','paid','void') NOT NULL DEFAULT 'draft',
	`issue_date` datetime NOT NULL,
	`due_date` datetime NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`tax_amount` decimal(10,2) NOT NULL,
	`total_amount` decimal(10,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`deleted_at` timestamp,
	`customer_id` bigint unsigned,
	`booking_id` varchar(255) NOT NULL,
	CONSTRAINT `invoice_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoice_number_unique` UNIQUE(`invoice_number`)
);
--> statement-breakpoint
CREATE TABLE `invoice_item` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`description` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`unit_price` decimal(10,2) NOT NULL,
	`total_price` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`invoice_id` bigint unsigned NOT NULL,
	CONSTRAINT `invoice_item_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`type` varchar(255) NOT NULL,
	`status` varchar(255) NOT NULL,
	`payment_date` datetime NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`payment_method` varchar(64) NOT NULL,
	`reference` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`deleted_at` timestamp,
	`customer_id` bigint unsigned,
	CONSTRAINT `payment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_invoice` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`payment_id` bigint unsigned NOT NULL,
	`invoice_id` bigint unsigned NOT NULL,
	`amount_applied` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `payment_invoice_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`deleted_at` timestamp,
	`tenant_id` varchar(255) NOT NULL,
	CONSTRAINT `payment_methods_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_method_tenant_name_idx` UNIQUE(`tenant_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `asset_type` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`image` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	`deleted_at` timestamp,
	`tenant_id` varchar(255) NOT NULL,
	CONSTRAINT `asset_type_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_type_has_booking_forms` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`asset_type_id` bigint unsigned NOT NULL,
	`booking_form_id` bigint unsigned NOT NULL,
	CONSTRAINT `asset_type_has_booking_forms_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_type_form_unique` UNIQUE(`asset_type_id`,`booking_form_id`)
);
--> statement-breakpoint
CREATE TABLE `asset_type_propertys` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`asset_type_id` bigint unsigned NOT NULL,
	`asset_property_id` bigint unsigned NOT NULL,
	`required` boolean NOT NULL DEFAULT false,
	CONSTRAINT `asset_type_propertys_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_type_property_unique` UNIQUE(`asset_type_id`,`asset_property_id`)
);
--> statement-breakpoint
CREATE TABLE `asset_type_has_tags` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`tag_id` bigint unsigned NOT NULL,
	`asset_type_id` bigint unsigned NOT NULL,
	CONSTRAINT `asset_type_has_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_type_tag_unique` UNIQUE(`asset_type_id`,`tag_id`)
);
--> statement-breakpoint
CREATE TABLE `at_property_values` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`asset_type_id` bigint unsigned NOT NULL,
	`asset_property_id` bigint unsigned NOT NULL,
	`value` text NOT NULL,
	CONSTRAINT `at_property_values_id` PRIMARY KEY(`id`),
	CONSTRAINT `at_property_value_unique` UNIQUE(`asset_type_id`,`asset_property_id`)
);
--> statement-breakpoint
CREATE TABLE `booking_forms` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`deleted_at` timestamp,
	`tenant_id` varchar(255) NOT NULL,
	CONSTRAINT `booking_forms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `booking_form_fields` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`form_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('number','text','textarea','date','time','date_range','range','boolean','select') NOT NULL,
	`required` boolean NOT NULL,
	`placeholder` varchar(255),
	`help_text` text,
	`min_value` varchar(100),
	`max_value` varchar(100),
	`options` text,
	`allow_multiple` boolean DEFAULT false,
	`display_order` bigint unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `booking_form_fields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tag_has_booking_forms` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`tag_id` bigint unsigned NOT NULL,
	`booking_form_id` bigint unsigned NOT NULL,
	CONSTRAINT `tag_has_booking_forms_id` PRIMARY KEY(`id`),
	CONSTRAINT `tag_form_unique` UNIQUE(`tag_id`,`booking_form_id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`tag_image` varchar(255),
	`tenant_id` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `name_unique` UNIQUE(`name`,`tenant_id`)
);
--> statement-breakpoint
CREATE TABLE `asset_properties` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`propertyType` enum('number','string','textbox','list') NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `asset_properties_id` PRIMARY KEY(`id`),
	CONSTRAINT `name_unique` UNIQUE(`name`,`tenant_id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`subdomain` varchar(255),
	`enable_automatic_confirmation` boolean NOT NULL DEFAULT true,
	`book_by_asset_type` boolean NOT NULL DEFAULT false,
	`logo_url` varchar(500),
	`address` varchar(500),
	`phone` varchar(20),
	`email` varchar(100),
	`background_image` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_subdomain_unique` UNIQUE(`subdomain`),
	CONSTRAINT `subdomain_unique` UNIQUE(`subdomain`)
);
--> statement-breakpoint
CREATE TABLE `tenant_has_users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`is_admin` boolean DEFAULT false,
	CONSTRAINT `tenant_has_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_idx` UNIQUE(`tenant_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `tenant_team_has_assets` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`team_id` bigint unsigned NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	CONSTRAINT `tenant_team_has_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tennat_team_has_users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`team_id` bigint unsigned NOT NULL,
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `tennat_team_has_users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenant_teams` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`deleted_at` timestamp,
	CONSTRAINT `tenant_teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_reset` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`used_at` timestamp,
	CONSTRAINT `password_reset_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`hashed_token` varchar(255) NOT NULL,
	`device_info` varchar(255),
	`ip_address` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`file_url` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`maintenance_id` varchar(255) NOT NULL,
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` varchar(36) NOT NULL,
	`key` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`scopes` json DEFAULT ('[]'),
	`is_active` boolean DEFAULT true,
	`tenant_id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `addon_item` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`billing_type` enum('per_unit','flat') NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `addon_item_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `booking_addon` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`booking_id` varchar(36) NOT NULL,
	`addon_item_id` bigint unsigned NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unit_price` decimal(10,2) NOT NULL,
	`billing_type` enum('per_unit','flat') NOT NULL,
	`total_price` decimal(10,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `booking_addon_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `booking_tax_fee` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`booking_id` varchar(36) NOT NULL,
	`tax_fee_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('tax','fee') NOT NULL,
	`calculation_type` enum('percentage','fixed_per_unit','fixed_flat') NOT NULL,
	`rate` decimal(10,4) NOT NULL,
	`calculation_basis` enum('net','gross') NOT NULL,
	`calculated_amount` decimal(10,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `booking_tax_fee_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tax_fee` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('tax','fee') NOT NULL,
	`calculation_type` enum('percentage','fixed_per_unit','fixed_flat') NOT NULL,
	`rate` decimal(10,4) NOT NULL,
	`calculation_basis` enum('net','gross') NOT NULL,
	`max_units` int,
	`min_amount` decimal(10,2),
	`max_amount` decimal(10,2),
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `tax_fee_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customer_details` ADD CONSTRAINT `customer_details_customer_type_id_customer_types_id_fk` FOREIGN KEY (`customer_type_id`) REFERENCES `customer_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_details` ADD CONSTRAINT `customer_details_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_types` ADD CONSTRAINT `customer_types_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `owner_details` ADD CONSTRAINT `owner_details_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `owner_has_assets` ADD CONSTRAINT `owner_has_assets_owner_id_owner_details_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `owner_details`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `owner_has_assets` ADD CONSTRAINT `owner_has_assets_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roles` ADD CONSTRAINT `roles_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_has_roles` ADD CONSTRAINT `user_has_roles_roles_id_roles_id_fk` FOREIGN KEY (`roles_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_has_roles` ADD CONSTRAINT `user_has_roles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_has_roles` ADD CONSTRAINT `user_has_roles_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_tasks` ADD CONSTRAINT `maintenance_tasks_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rate` ADD CONSTRAINT `rate_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rate` ADD CONSTRAINT `rate_asset_type_id_asset_type_id_fk` FOREIGN KEY (`asset_type_id`) REFERENCES `asset_type`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rate` ADD CONSTRAINT `rate_rate_type_id_rate_type_id_fk` FOREIGN KEY (`rate_type_id`) REFERENCES `rate_type`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rate_type` ADD CONSTRAINT `rate_type_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_asset_type_id_asset_type_id_fk` FOREIGN KEY (`asset_type_id`) REFERENCES `asset_type`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_booking_forms` ADD CONSTRAINT `asset_has_booking_forms_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_booking_forms` ADD CONSTRAINT `asset_has_booking_forms_booking_form_id_booking_forms_id_fk` FOREIGN KEY (`booking_form_id`) REFERENCES `booking_forms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_properties` ADD CONSTRAINT `asset_has_properties_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_properties` ADD CONSTRAINT `asset_has_properties_asset_property_id_asset_properties_id_fk` FOREIGN KEY (`asset_property_id`) REFERENCES `asset_properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_rates` ADD CONSTRAINT `asset_has_rates_rate_id_rate_id_fk` FOREIGN KEY (`rate_id`) REFERENCES `rate`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_rates` ADD CONSTRAINT `asset_has_rates_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_images` ADD CONSTRAINT `asset_images_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blocked_date` ADD CONSTRAINT `blocked_date_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blocked_date` ADD CONSTRAINT `blocked_date_booking_id_booking_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking` ADD CONSTRAINT `booking_customer_id_customer_details_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customer_details`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking` ADD CONSTRAINT `booking_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_form_field_value` ADD CONSTRAINT `booking_form_field_value_booking_id_booking_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_form_field_value` ADD CONSTRAINT `booking_form_field_value_form_field_id_booking_form_fields_id_fk` FOREIGN KEY (`form_field_id`) REFERENCES `booking_form_fields`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_upate_token` ADD CONSTRAINT `booking_upate_token_customer_id_customer_details_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customer_details`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_upate_token` ADD CONSTRAINT `booking_upate_token_booking_id_booking_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `slots` ADD CONSTRAINT `slots_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `slots` ADD CONSTRAINT `slots_booking_id_booking_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credit_note` ADD CONSTRAINT `credit_note_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credit_note` ADD CONSTRAINT `credit_note_invoice_id_invoice_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_customer_id_customer_details_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customer_details`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_booking_id_booking_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoice_item` ADD CONSTRAINT `invoice_item_invoice_id_invoice_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment` ADD CONSTRAINT `payment_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment` ADD CONSTRAINT `payment_customer_id_customer_details_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customer_details`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_invoice` ADD CONSTRAINT `payment_invoice_payment_id_payment_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_invoice` ADD CONSTRAINT `payment_invoice_invoice_id_invoice_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_methods` ADD CONSTRAINT `payment_methods_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_type` ADD CONSTRAINT `asset_type_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_type_has_booking_forms` ADD CONSTRAINT `asset_type_has_booking_forms_asset_type_id_asset_type_id_fk` FOREIGN KEY (`asset_type_id`) REFERENCES `asset_type`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_type_has_booking_forms` ADD CONSTRAINT `asset_type_has_booking_forms_booking_form_id_booking_forms_id_fk` FOREIGN KEY (`booking_form_id`) REFERENCES `booking_forms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_type_propertys` ADD CONSTRAINT `asset_type_propertys_asset_type_id_asset_type_id_fk` FOREIGN KEY (`asset_type_id`) REFERENCES `asset_type`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_type_propertys` ADD CONSTRAINT `asset_type_propertys_asset_property_id_asset_properties_id_fk` FOREIGN KEY (`asset_property_id`) REFERENCES `asset_properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_type_has_tags` ADD CONSTRAINT `asset_type_has_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_type_has_tags` ADD CONSTRAINT `asset_type_has_tags_asset_type_id_asset_type_id_fk` FOREIGN KEY (`asset_type_id`) REFERENCES `asset_type`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `at_property_values` ADD CONSTRAINT `at_property_values_asset_type_id_asset_type_id_fk` FOREIGN KEY (`asset_type_id`) REFERENCES `asset_type`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `at_property_values` ADD CONSTRAINT `at_property_values_asset_property_id_asset_properties_id_fk` FOREIGN KEY (`asset_property_id`) REFERENCES `asset_properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_forms` ADD CONSTRAINT `booking_forms_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_form_fields` ADD CONSTRAINT `booking_form_fields_form_id_booking_forms_id_fk` FOREIGN KEY (`form_id`) REFERENCES `booking_forms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tag_has_booking_forms` ADD CONSTRAINT `tag_has_booking_forms_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tag_has_booking_forms` ADD CONSTRAINT `tag_has_booking_forms_booking_form_id_booking_forms_id_fk` FOREIGN KEY (`booking_form_id`) REFERENCES `booking_forms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `tags_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_properties` ADD CONSTRAINT `asset_properties_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_has_users` ADD CONSTRAINT `tenant_has_users_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_has_users` ADD CONSTRAINT `tenant_has_users_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_team_has_assets` ADD CONSTRAINT `tenant_team_has_assets_team_id_tenant_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `tenant_teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_team_has_assets` ADD CONSTRAINT `tenant_team_has_assets_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tennat_team_has_users` ADD CONSTRAINT `tennat_team_has_users_team_id_tenant_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `tenant_teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tennat_team_has_users` ADD CONSTRAINT `tennat_team_has_users_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_teams` ADD CONSTRAINT `tenant_teams_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_reset` ADD CONSTRAINT `password_reset_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_maintenance_id_maintenance_tasks_id_fk` FOREIGN KEY (`maintenance_id`) REFERENCES `maintenance_tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `addon_item` ADD CONSTRAINT `addon_item_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_addon` ADD CONSTRAINT `booking_addon_booking_id_booking_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_addon` ADD CONSTRAINT `booking_addon_addon_item_id_addon_item_id_fk` FOREIGN KEY (`addon_item_id`) REFERENCES `addon_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_tax_fee` ADD CONSTRAINT `booking_tax_fee_booking_id_booking_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_tax_fee` ADD CONSTRAINT `booking_tax_fee_tax_fee_id_tax_fee_id_fk` FOREIGN KEY (`tax_fee_id`) REFERENCES `tax_fee`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tax_fee` ADD CONSTRAINT `tax_fee_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `customer_type_deleted_at_idx` ON `customer_types` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `owner_deleted_at_idx` ON `owner_details` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `roles_deleted_at_idx` ON `roles` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `asset_idx` ON `maintenance_tasks` (`asset_id`);--> statement-breakpoint
CREATE INDEX `maintenance_deleted_at_idx` ON `maintenance_tasks` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `asset_type_idx` ON `assets` (`asset_type_id`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `assets` (`user_id`);--> statement-breakpoint
CREATE INDEX `deleted_at_idx` ON `assets` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `blocked_tenant_idx` ON `blocked_date` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `blocked_asset_idx` ON `blocked_date` (`asset_id`);--> statement-breakpoint
CREATE INDEX `blocked_date_idx` ON `blocked_date` (`start_date`,`end_date`);--> statement-breakpoint
CREATE INDEX `blocked_booking_idx` ON `blocked_date` (`booking_id`);--> statement-breakpoint
CREATE INDEX `asset_idx` ON `booking` (`asset_id`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `booking` (`customer_id`);--> statement-breakpoint
CREATE INDEX `deleted_at_idx` ON `booking` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `booking_idx` ON `booking_form_field_value` (`booking_id`);--> statement-breakpoint
CREATE INDEX `form_field_idx` ON `booking_form_field_value` (`form_field_id`);--> statement-breakpoint
CREATE INDEX `customer_id_idx` ON `booking_upate_token` (`customer_id`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `booking_upate_token` (`token`);--> statement-breakpoint
CREATE INDEX `slot_asset_idx` ON `slots` (`asset_id`);--> statement-breakpoint
CREATE INDEX `slot_date_idx` ON `slots` (`date`);--> statement-breakpoint
CREATE INDEX `slot_booking_idx` ON `slots` (`booking_id`);--> statement-breakpoint
CREATE INDEX `slot_availability_idx` ON `slots` (`asset_id`,`date`,`status`);--> statement-breakpoint
CREATE INDEX `credit_note_invoice_idx` ON `credit_note` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `credit_note_tenant_idx` ON `credit_note` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `invoice` (`customer_id`);--> statement-breakpoint
CREATE INDEX `booking_idx` ON `invoice` (`booking_id`);--> statement-breakpoint
CREATE INDEX `invoice_deleted_at_idx` ON `invoice` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `invoice_idx` ON `invoice_item` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `payment` (`customer_id`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `payment` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `payment_deleted_at_idx` ON `payment` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `payment_method_deleted_at_idx` ON `payment_methods` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `asset_type_deleted_at_idx` ON `asset_type` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `booking_form_deleted_at_idx` ON `booking_forms` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `form_idx` ON `booking_form_fields` (`form_id`);--> statement-breakpoint
CREATE INDEX `tags_deleted_at_idx` ON `tags` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `asset_property_deleted_at_idx` ON `asset_properties` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `tenant_deleted_at_idx` ON `tenants` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `tenant_teams_deleted_at_idx` ON `tenant_teams` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `password_reset` (`user_id`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `password_reset` (`token`);--> statement-breakpoint
CREATE INDEX `maintenance_task_idx` ON `files` (`maintenance_id`);--> statement-breakpoint
CREATE INDEX `addon_tenant_idx` ON `addon_item` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `booking_addon_booking_idx` ON `booking_addon` (`booking_id`);--> statement-breakpoint
CREATE INDEX `booking_addon_addon_idx` ON `booking_addon` (`addon_item_id`);--> statement-breakpoint
CREATE INDEX `booking_tax_fee_booking_idx` ON `booking_tax_fee` (`booking_id`);--> statement-breakpoint
CREATE INDEX `booking_tax_fee_tax_fee_idx` ON `booking_tax_fee` (`tax_fee_id`);--> statement-breakpoint
CREATE INDEX `tax_fee_tenant_idx` ON `tax_fee` (`tenant_id`);