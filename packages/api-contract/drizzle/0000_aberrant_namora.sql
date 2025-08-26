CREATE TABLE `customer_details` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`phone` varchar(255),
	`address` varchar(255),
	`contact_id` bigint unsigned,
	`date_of_birth` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`tenant_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `customer_details_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_user_compound_idx` UNIQUE(`tenant_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `owner_details` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`phone` varchar(255),
	`address` varchar(255),
	`company_name` varchar(255),
	`contact_id` bigint unsigned,
	`tax_id` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`tenant_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `owner_details_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_user_compound_idx` UNIQUE(`tenant_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `role_has_permissions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`role_id` bigint unsigned NOT NULL,
	`permission` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `role_has_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`tenant_id` varchar(255),
	CONSTRAINT `roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`user_type` enum('customer','owner','system','admin') NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `user_has_assets` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	`type` enum('owner','manager') NOT NULL DEFAULT 'manager',
	CONSTRAINT `user_has_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_has_bookings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`booking_id` varchar(255) NOT NULL,
	CONSTRAINT `user_has_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_has_roles` (
	`id` serial AUTO_INCREMENT NOT NULL,
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
	CONSTRAINT `maintenance_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`requires_approval` boolean NOT NULL DEFAULT false,
	`asset_type_id` bigint unsigned,
	`user_id` varchar(255),
	`tenant_id` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_has_booking_forms` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`booking_form_id` bigint unsigned,
	CONSTRAINT `asset_has_booking_forms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_has_properties` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`asset_property_id` bigint unsigned NOT NULL,
	`value` varchar(255) NOT NULL,
	CONSTRAINT `asset_has_properties_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_property_unique` UNIQUE(`tenant_id`,`asset_property_id`)
);
--> statement-breakpoint
CREATE TABLE `asset_has_rates` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`rate_id` bigint unsigned NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	CONSTRAINT `asset_has_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_has_tags` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tag_id` bigint unsigned,
	`asset_id` varchar(255) NOT NULL,
	CONSTRAINT `asset_has_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_images` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	`file_path` varchar(255) NOT NULL,
	`image_type` enum('primary','secondary','gallery') NOT NULL DEFAULT 'gallery',
	CONSTRAINT `asset_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `booking` (
	`id` varchar(36) NOT NULL,
	`start_date` datetime NOT NULL,
	`end_date` datetime NOT NULL,
	`status` varchar(255),
	`totalPrice` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`asset_id` varchar(255) NOT NULL,
	CONSTRAINT `booking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `booking_form_field_value` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`form_field_id` bigint unsigned NOT NULL,
	`value` text NOT NULL,
	CONSTRAINT `booking_form_field_value_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rate` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`min_nights` int,
	`max_nights` int,
	`price_per_night` decimal,
	`priority` int DEFAULT 100,
	CONSTRAINT `rate_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `slots` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	`date` date NOT NULL,
	`start_time` varchar(8) NOT NULL,
	`end_time` varchar(8) NOT NULL,
	`status` varchar(20) NOT NULL,
	`booking_id` varchar(36),
	`price` decimal(10,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`invoice_number` varchar(255) NOT NULL,
	`status` varchar(255) NOT NULL,
	`issue_date` datetime NOT NULL,
	`due_date` datetime NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`tax_amount` decimal(10,2) NOT NULL,
	`total_amount` decimal(10,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`customer_id` bigint unsigned NOT NULL,
	`booking_id` varchar(255) NOT NULL,
	CONSTRAINT `invoice_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoice_number_unique` UNIQUE(`invoice_number`)
);
--> statement-breakpoint
CREATE TABLE `invoice_item` (
	`id` serial AUTO_INCREMENT NOT NULL,
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
	`id` serial AUTO_INCREMENT NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`type` varchar(255) NOT NULL,
	`status` varchar(255) NOT NULL,
	`payment_date` datetime NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`customer_id` bigint unsigned NOT NULL,
	CONSTRAINT `payment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_invoice` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`payment_id` bigint unsigned NOT NULL,
	`invoice_id` bigint unsigned NOT NULL,
	`amount_applied` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `payment_invoice_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_type` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	`tenant_id` varchar(255) NOT NULL,
	CONSTRAINT `asset_type_id` PRIMARY KEY(`id`),
	CONSTRAINT `name_unique` UNIQUE(`name`,`tenant_id`)
);
--> statement-breakpoint
CREATE TABLE `asset_type_propertys` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`asset_type_id` bigint unsigned NOT NULL,
	`asset_property_id` bigint unsigned NOT NULL,
	`required` boolean NOT NULL DEFAULT false,
	CONSTRAINT `asset_type_propertys_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_type_property_unique` UNIQUE(`asset_type_id`,`asset_property_id`)
);
--> statement-breakpoint
CREATE TABLE `booking_forms` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`tenant_id` varchar(255) NOT NULL,
	CONSTRAINT `booking_forms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `booking_form_fields` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`form_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('number','text','textarea','date','time','date_range','range','boolean') NOT NULL,
	`required` boolean NOT NULL,
	CONSTRAINT `booking_form_fields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_properties` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`propertyType` enum('number','string','textbox','list') NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `asset_properties_id` PRIMARY KEY(`id`),
	CONSTRAINT `name_unique` UNIQUE(`name`,`tenant_id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`subdomain` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `subdomain_unique` UNIQUE(`subdomain`)
);
--> statement-breakpoint
CREATE TABLE `tenant_has_users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`is_admin` boolean DEFAULT false,
	CONSTRAINT `tenant_has_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_idx` UNIQUE(`tenant_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `tenant_team_has_assets` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`team_id` bigint unsigned NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	CONSTRAINT `tenant_team_has_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tennat_team_has_users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`team_id` bigint unsigned NOT NULL,
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `tennat_team_has_users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenant_teams` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
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
	`id` serial AUTO_INCREMENT NOT NULL,
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
	`id` serial AUTO_INCREMENT NOT NULL,
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
CREATE TABLE `brochure` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`contact_id` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `brochure_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brochure_has_assets` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`brochure_id` bigint unsigned NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brochure_has_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `brochure_asset_unique` UNIQUE(`tenant_id`,`brochure_id`,`asset_id`)
);
--> statement-breakpoint
CREATE TABLE `communication_log` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`contact_id` bigint unsigned NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`date` datetime NOT NULL,
	`communication_type` enum('Email','Phone Call','Meeting') NOT NULL,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `communication_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`first_name` varchar(255) NOT NULL,
	`last_name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(64),
	`address` varchar(1024),
	`inquiry_source` enum('Website','Referral','Walk-In','Social','Other') DEFAULT 'Website',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `contact_id` PRIMARY KEY(`id`),
	CONSTRAINT `contact_email_tenant_unique` UNIQUE(`tenant_id`,`email`),
	CONSTRAINT `contact_tenant_user_unique` UNIQUE(`tenant_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `document` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`contact_id` bigint unsigned NOT NULL,
	`document_type` enum('Contract','Brochure','Feedback Form','Other') NOT NULL DEFAULT 'Other',
	`file_path` varchar(2048) NOT NULL,
	`uploaded_by` varchar(36) NOT NULL,
	`uploaded_at` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `document_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`contact_id` bigint unsigned NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	`viewing_date` datetime NOT NULL,
	`comments` text,
	`rating` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inquiry` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`contact_id` bigint unsigned NOT NULL,
	`asset_id` varchar(255) NOT NULL,
	`inquiry_date` datetime NOT NULL,
	`inquiry_status` enum('New','Follow-Up','Closed') NOT NULL DEFAULT 'New',
	`follow_up_date` datetime,
	`assigned_to` varchar(36) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `inquiry_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`contact_id` bigint unsigned,
	`description` text NOT NULL,
	`due_date` datetime NOT NULL,
	`task_status` enum('Pending','Completed','Overdue') NOT NULL DEFAULT 'Pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `task_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customer_details` ADD CONSTRAINT `customer_details_contact_id_contact_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contact`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_details` ADD CONSTRAINT `customer_details_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_details` ADD CONSTRAINT `customer_details_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `owner_details` ADD CONSTRAINT `owner_details_contact_id_contact_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contact`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `owner_details` ADD CONSTRAINT `owner_details_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `owner_details` ADD CONSTRAINT `owner_details_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roles` ADD CONSTRAINT `roles_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_has_assets` ADD CONSTRAINT `user_has_assets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_has_assets` ADD CONSTRAINT `user_has_assets_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_has_bookings` ADD CONSTRAINT `user_has_bookings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_has_bookings` ADD CONSTRAINT `user_has_bookings_booking_id_booking_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_has_roles` ADD CONSTRAINT `user_has_roles_roles_id_roles_id_fk` FOREIGN KEY (`roles_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_has_roles` ADD CONSTRAINT `user_has_roles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_has_roles` ADD CONSTRAINT `user_has_roles_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_tasks` ADD CONSTRAINT `maintenance_tasks_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_asset_type_id_asset_type_id_fk` FOREIGN KEY (`asset_type_id`) REFERENCES `asset_type`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_booking_forms` ADD CONSTRAINT `asset_has_booking_forms_tenant_id_assets_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_booking_forms` ADD CONSTRAINT `asset_has_booking_forms_booking_form_id_booking_forms_id_fk` FOREIGN KEY (`booking_form_id`) REFERENCES `booking_forms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_properties` ADD CONSTRAINT `asset_has_properties_tenant_id_assets_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_properties` ADD CONSTRAINT `asset_has_properties_asset_property_id_asset_properties_id_fk` FOREIGN KEY (`asset_property_id`) REFERENCES `asset_properties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_rates` ADD CONSTRAINT `asset_has_rates_rate_id_rate_id_fk` FOREIGN KEY (`rate_id`) REFERENCES `rate`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_rates` ADD CONSTRAINT `asset_has_rates_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_tags` ADD CONSTRAINT `asset_has_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_tags` ADD CONSTRAINT `asset_has_tags_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_images` ADD CONSTRAINT `asset_images_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking` ADD CONSTRAINT `booking_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_form_field_value` ADD CONSTRAINT `booking_form_field_value_tenant_id_booking_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `booking`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_form_field_value` ADD CONSTRAINT `booking_form_field_value_form_field_id_booking_form_fields_id_fk` FOREIGN KEY (`form_field_id`) REFERENCES `booking_form_fields`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `slots` ADD CONSTRAINT `slots_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `slots` ADD CONSTRAINT `slots_booking_id_booking_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_customer_id_customer_details_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customer_details`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoice_item` ADD CONSTRAINT `invoice_item_invoice_id_invoice_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment` ADD CONSTRAINT `payment_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment` ADD CONSTRAINT `payment_customer_id_customer_details_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customer_details`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_invoice` ADD CONSTRAINT `payment_invoice_payment_id_payment_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_invoice` ADD CONSTRAINT `payment_invoice_invoice_id_invoice_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_type` ADD CONSTRAINT `asset_type_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_type_propertys` ADD CONSTRAINT `asset_type_propertys_asset_type_id_asset_type_id_fk` FOREIGN KEY (`asset_type_id`) REFERENCES `asset_type`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_type_propertys` ADD CONSTRAINT `asset_type_propertys_asset_property_id_asset_properties_id_fk` FOREIGN KEY (`asset_property_id`) REFERENCES `asset_properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_forms` ADD CONSTRAINT `booking_forms_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_form_fields` ADD CONSTRAINT `booking_form_fields_form_id_booking_forms_id_fk` FOREIGN KEY (`form_id`) REFERENCES `booking_forms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_properties` ADD CONSTRAINT `asset_properties_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_has_users` ADD CONSTRAINT `tenant_has_users_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_has_users` ADD CONSTRAINT `tenant_has_users_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_team_has_assets` ADD CONSTRAINT `tenant_team_has_assets_team_id_tenant_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `tenant_teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_team_has_assets` ADD CONSTRAINT `tenant_team_has_assets_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tennat_team_has_users` ADD CONSTRAINT `tennat_team_has_users_team_id_tenant_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `tenant_teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tennat_team_has_users` ADD CONSTRAINT `tennat_team_has_users_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_teams` ADD CONSTRAINT `tenant_teams_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_reset` ADD CONSTRAINT `password_reset_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_maintenance_id_maintenance_tasks_id_fk` FOREIGN KEY (`maintenance_id`) REFERENCES `maintenance_tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `brochure` ADD CONSTRAINT `brochure_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `brochure` ADD CONSTRAINT `brochure_contact_id_contact_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contact`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `brochure_has_assets` ADD CONSTRAINT `brochure_has_assets_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `brochure_has_assets` ADD CONSTRAINT `brochure_has_assets_brochure_id_brochure_id_fk` FOREIGN KEY (`brochure_id`) REFERENCES `brochure`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `brochure_has_assets` ADD CONSTRAINT `brochure_has_assets_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communication_log` ADD CONSTRAINT `communication_log_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communication_log` ADD CONSTRAINT `communication_log_contact_id_contact_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contact`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communication_log` ADD CONSTRAINT `communication_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contact` ADD CONSTRAINT `contact_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contact` ADD CONSTRAINT `contact_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document` ADD CONSTRAINT `document_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document` ADD CONSTRAINT `document_contact_id_contact_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contact`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document` ADD CONSTRAINT `document_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_contact_id_contact_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contact`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inquiry` ADD CONSTRAINT `inquiry_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inquiry` ADD CONSTRAINT `inquiry_contact_id_contact_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contact`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inquiry` ADD CONSTRAINT `inquiry_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inquiry` ADD CONSTRAINT `inquiry_assigned_to_users_id_fk` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task` ADD CONSTRAINT `task_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task` ADD CONSTRAINT `task_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task` ADD CONSTRAINT `task_contact_id_contact_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contact`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `asset_idx` ON `maintenance_tasks` (`asset_id`);--> statement-breakpoint
CREATE INDEX `asset_type_idx` ON `assets` (`asset_type_id`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `assets` (`user_id`);--> statement-breakpoint
CREATE INDEX `asset_idx` ON `booking` (`asset_id`);--> statement-breakpoint
CREATE INDEX `booking_idx` ON `booking_form_field_value` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `form_field_idx` ON `booking_form_field_value` (`form_field_id`);--> statement-breakpoint
CREATE INDEX `slot_asset_idx` ON `slots` (`asset_id`);--> statement-breakpoint
CREATE INDEX `slot_date_idx` ON `slots` (`date`);--> statement-breakpoint
CREATE INDEX `slot_booking_idx` ON `slots` (`booking_id`);--> statement-breakpoint
CREATE INDEX `slot_availability_idx` ON `slots` (`asset_id`,`date`,`status`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `invoice` (`customer_id`);--> statement-breakpoint
CREATE INDEX `booking_idx` ON `invoice` (`booking_id`);--> statement-breakpoint
CREATE INDEX `invoice_idx` ON `invoice_item` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `payment` (`customer_id`);--> statement-breakpoint
CREATE INDEX `form_idx` ON `booking_form_fields` (`form_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `password_reset` (`user_id`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `password_reset` (`token`);--> statement-breakpoint
CREATE INDEX `maintenance_task_idx` ON `files` (`maintenance_id`);--> statement-breakpoint
CREATE INDEX `brochure_tenant_idx` ON `brochure` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `brochure_contact_idx` ON `brochure` (`contact_id`);--> statement-breakpoint
CREATE INDEX `bp_tenant_idx` ON `brochure_has_assets` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `bp_brochure_idx` ON `brochure_has_assets` (`brochure_id`);--> statement-breakpoint
CREATE INDEX `bp_asset_idx` ON `brochure_has_assets` (`asset_id`);--> statement-breakpoint
CREATE INDEX `comm_tenant_idx` ON `communication_log` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `comm_contact_idx` ON `communication_log` (`contact_id`);--> statement-breakpoint
CREATE INDEX `comm_user_idx` ON `communication_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `comm_type_idx` ON `communication_log` (`communication_type`);--> statement-breakpoint
CREATE INDEX `comm_date_idx` ON `communication_log` (`date`);--> statement-breakpoint
CREATE INDEX `contact_tenant_idx` ON `contact` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `doc_tenant_idx` ON `document` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `doc_contact_idx` ON `document` (`contact_id`);--> statement-breakpoint
CREATE INDEX `doc_type_idx` ON `document` (`document_type`);--> statement-breakpoint
CREATE INDEX `doc_uploader_idx` ON `document` (`uploaded_by`);--> statement-breakpoint
CREATE INDEX `feedback_tenant_idx` ON `feedback` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `feedback_contact_idx` ON `feedback` (`contact_id`);--> statement-breakpoint
CREATE INDEX `feedback_asset_idx` ON `feedback` (`asset_id`);--> statement-breakpoint
CREATE INDEX `feedback_rating_idx` ON `feedback` (`rating`);--> statement-breakpoint
CREATE INDEX `inquiry_tenant_idx` ON `inquiry` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `inquiry_contact_idx` ON `inquiry` (`contact_id`);--> statement-breakpoint
CREATE INDEX `inquiry_asset_idx` ON `inquiry` (`asset_id`);--> statement-breakpoint
CREATE INDEX `inquiry_assigned_idx` ON `inquiry` (`assigned_to`);--> statement-breakpoint
CREATE INDEX `inquiry_status_idx` ON `inquiry` (`inquiry_status`);--> statement-breakpoint
CREATE INDEX `task_tenant_idx` ON `task` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `task_user_idx` ON `task` (`user_id`);--> statement-breakpoint
CREATE INDEX `task_contact_idx` ON `task` (`contact_id`);--> statement-breakpoint
CREATE INDEX `task_status_idx` ON `task` (`task_status`);--> statement-breakpoint
CREATE INDEX `task_due_idx` ON `task` (`due_date`);