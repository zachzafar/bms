-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations

CREATE TABLE `asset` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`available` tinyint(1) NOT NULL DEFAULT 1,
	`requires_approval` tinyint(1) NOT NULL DEFAULT 0,
	`asset_type_id` bigint unsigned,
	`group_id` bigint unsigned,
	`owner_id` bigint unsigned,
	`tenant_id` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `asset_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_has_properties` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`asset_id` bigint unsigned NOT NULL,
	`asset_property_id` bigint unsigned NOT NULL,
	`value` varchar(255) NOT NULL,
	CONSTRAINT `asset_has_properties_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `asset_property_unique` UNIQUE(`asset_id`,`asset_property_id`)
);
--> statement-breakpoint
CREATE TABLE `asset_property` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`property_type` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `asset_property_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `asset_type` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`booking_form_id` bigint unsigned,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `asset_type_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `name_unique` UNIQUE(`name`),
	CONSTRAINT `booking_form_unique` UNIQUE(`booking_form_id`)
);
--> statement-breakpoint
CREATE TABLE `asset_type_has_properties` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`asset_type_id` bigint unsigned NOT NULL,
	`asset_property_id` bigint unsigned NOT NULL,
	`required` tinyint(1) NOT NULL DEFAULT 0,
	CONSTRAINT `asset_type_has_properties_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `asset_type_property_unique` UNIQUE(`asset_type_id`,`asset_property_id`)
);
--> statement-breakpoint
CREATE TABLE `availability` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`asset_id` bigint unsigned NOT NULL,
	`date` int NOT NULL,
	`price` decimal(1,0),
	`available` tinyint(1) NOT NULL,
	CONSTRAINT `availability_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `booking` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`start_date` datetime NOT NULL,
	`end_date` datetime NOT NULL,
	`status` varchar(255) NOT NULL,
	`totalPrice` decimal(1,0),
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`asset_id` bigint unsigned NOT NULL,
	`customer_id` bigint unsigned NOT NULL,
	CONSTRAINT `booking_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `booking_form` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `booking_form_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `booking_form_field` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`form_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(50) NOT NULL,
	`required` tinyint(1) NOT NULL,
	CONSTRAINT `booking_form_field_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `booking_form_field_value` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`booking_id` bigint unsigned NOT NULL,
	`form_field_id` bigint unsigned NOT NULL,
	`value` text NOT NULL,
	CONSTRAINT `booking_form_field_value_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `category` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`asset_type_id` bigint unsigned,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `category_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`first_name` varchar(255) NOT NULL,
	`last_name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(255),
	`address` varchar(255),
	`date_of_birth` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `customer_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `email_unique` UNIQUE(`email`),
	CONSTRAINT `user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `file` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_url` varchar(255) NOT NULL,
	`file_type` varchar(255) NOT NULL,
	`file_size` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`asset_id` bigint unsigned,
	`maintenance_task_id` bigint unsigned,
	CONSTRAINT `file_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `group` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`group_type_id` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `group_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_type` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `group_type_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_task` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`status` varchar(255) NOT NULL,
	`priority` varchar(255),
	`start_date` datetime NOT NULL,
	`end_date` datetime,
	`asset_id` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `maintenance_task_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `owner` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`first_name` varchar(255) NOT NULL,
	`last_name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(255),
	`address` varchar(255),
	`company_name` varchar(255),
	`tax_id` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `owner_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `email_unique` UNIQUE(`email`),
	CONSTRAINT `user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`hashed_token` varchar(255) NOT NULL,
	`device_info` varchar(255),
	`ip_address` varchar(45),
	`revoked` tinyint(1) DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenant` (
	`id` varchar(36) NOT NULL DEFAULT 'uuid()',
	`name` varchar(255) NOT NULL,
	`subdomain` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenant_id` PRIMARY KEY(`id`),
	CONSTRAINT `subdomain_unique` UNIQUE(`subdomain`)
);
--> statement-breakpoint
CREATE TABLE `tenant_has_users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `tenant_has_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `tenant_idx` UNIQUE(`tenant_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(36) NOT NULL DEFAULT 'uuid()',
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` enum('ADMIN','SYSADMIN','STAFF','OWNER','CUSTOMER') NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `asset` ADD CONSTRAINT `asset_asset_type_id_asset_type_id_fk` FOREIGN KEY (`asset_type_id`) REFERENCES `asset_type`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset` ADD CONSTRAINT `asset_group_id_group_id_fk` FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset` ADD CONSTRAINT `asset_owner_id_owner_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `owner`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset` ADD CONSTRAINT `asset_tenant_id_tenant_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenant`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_properties` ADD CONSTRAINT `asset_has_properties_asset_id_asset_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_properties` ADD CONSTRAINT `asset_has_properties_asset_property_id_asset_property_id_fk` FOREIGN KEY (`asset_property_id`) REFERENCES `asset_property`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_type` ADD CONSTRAINT `asset_type_booking_form_id_booking_form_id_fk` FOREIGN KEY (`booking_form_id`) REFERENCES `booking_form`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_type_has_properties` ADD CONSTRAINT `asset_type_has_properties_asset_property_id_asset_property_id_fk` FOREIGN KEY (`asset_property_id`) REFERENCES `asset_property`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_type_has_properties` ADD CONSTRAINT `asset_type_has_properties_asset_type_id_asset_type_id_fk` FOREIGN KEY (`asset_type_id`) REFERENCES `asset_type`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `availability` ADD CONSTRAINT `availability_asset_id_asset_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking` ADD CONSTRAINT `booking_asset_id_asset_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking` ADD CONSTRAINT `booking_customer_id_customer_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_form_field` ADD CONSTRAINT `booking_form_field_form_id_booking_form_id_fk` FOREIGN KEY (`form_id`) REFERENCES `booking_form`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_form_field_value` ADD CONSTRAINT `booking_form_field_value_booking_id_booking_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `booking_form_field_value` ADD CONSTRAINT `booking_form_field_value_form_field_id_booking_form_field_id_fk` FOREIGN KEY (`form_field_id`) REFERENCES `booking_form_field`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `category` ADD CONSTRAINT `category_asset_type_id_asset_type_id_fk` FOREIGN KEY (`asset_type_id`) REFERENCES `asset_type`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer` ADD CONSTRAINT `customer_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `file` ADD CONSTRAINT `file_asset_id_asset_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `file` ADD CONSTRAINT `file_maintenance_task_id_maintenance_task_id_fk` FOREIGN KEY (`maintenance_task_id`) REFERENCES `maintenance_task`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `group` ADD CONSTRAINT `group_group_type_id_group_type_id_fk` FOREIGN KEY (`group_type_id`) REFERENCES `group_type`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_task` ADD CONSTRAINT `maintenance_task_asset_id_asset_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `owner` ADD CONSTRAINT `owner_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_has_users` ADD CONSTRAINT `tenant_has_users_tenant_id_tenant_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenant`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_has_users` ADD CONSTRAINT `tenant_has_users_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `asset_type_idx` ON `asset` (`asset_type_id`);--> statement-breakpoint
CREATE INDEX `group_idx` ON `asset` (`group_id`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `asset` (`owner_id`);--> statement-breakpoint
CREATE INDEX `asset_idx` ON `availability` (`asset_id`);--> statement-breakpoint
CREATE INDEX `asset_idx` ON `booking` (`asset_id`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `booking` (`customer_id`);--> statement-breakpoint
CREATE INDEX `form_idx` ON `booking_form_field` (`form_id`);--> statement-breakpoint
CREATE INDEX `booking_idx` ON `booking_form_field_value` (`booking_id`);--> statement-breakpoint
CREATE INDEX `form_field_idx` ON `booking_form_field_value` (`form_field_id`);--> statement-breakpoint
CREATE INDEX `asset_type_idx` ON `category` (`asset_type_id`);--> statement-breakpoint
CREATE INDEX `asset_idx` ON `file` (`asset_id`);--> statement-breakpoint
CREATE INDEX `maintenance_task_idx` ON `file` (`maintenance_task_id`);--> statement-breakpoint
CREATE INDEX `group_type_idx` ON `group` (`group_type_id`);--> statement-breakpoint
CREATE INDEX `asset_idx` ON `maintenance_task` (`asset_id`);
