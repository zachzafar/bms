CREATE TABLE IF NOT EXISTS `customer` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`first_name` varchar(255) NOT NULL,
	`last_name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(255),
	`address` varchar(255),
	`tenant_id` varchar(255) NOT NULL,
	`date_of_birth` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `customer_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_unique` UNIQUE(`email`),
	CONSTRAINT `user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `owner` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`first_name` varchar(255) NOT NULL,
	`last_name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(255),
	`address` varchar(255),
	`tenant_id` varchar(255) NOT NULL,
	`company_name` varchar(255),
	`tax_id` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `owner_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_unique` UNIQUE(`email`),
	CONSTRAINT `user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`role` enum('ADMIN','SYSADMIN','STAFF','OWNER','CUSTOMER') NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `maintenance_task` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`status` varchar(255) NOT NULL,
	`priority` varchar(255),
	`start_date` datetime NOT NULL,
	`end_date` datetime,
	`tenant_id` varchar(255),
	`asset_id` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `maintenance_task_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `asset` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` varchar(50) NOT NULL,
	`requires_approval` boolean NOT NULL DEFAULT false,
	`asset_type_id` int NOT NULL,
	`group_id` int,
	`owner_id` varchar(255),
	`tenant_id` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `asset_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `asset_has_properties` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255),
	`asset_id` int NOT NULL,
	`asset_property_id` int NOT NULL,
	`value` varchar(255) NOT NULL,
	CONSTRAINT `asset_has_properties_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_property_unique` UNIQUE(`asset_id`,`asset_property_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `booking` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`start_date` datetime NOT NULL,
	`end_date` datetime NOT NULL,
	`status` varchar(255) NOT NULL,
	`form_data` json,
	`totalPrice` decimal(1),
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	`tenant_id` varchar(255) NOT NULL,
	`asset_id` int NOT NULL,
	`customer_id` varchar(255) NOT NULL,
	CONSTRAINT `booking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `asset_type` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`booking_form_id` varchar(255),
	`tenant_id` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `asset_type_id` PRIMARY KEY(`id`),
	CONSTRAINT `name_unique` UNIQUE(`name`),
	CONSTRAINT `booking_form_unique` UNIQUE(`booking_form_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `asset_type_has_properties` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`asset_type_id` int NOT NULL,
	`tenant_id` varchar(255),
	`asset_property_id` int NOT NULL,
	`required` boolean NOT NULL DEFAULT false,
	CONSTRAINT `asset_type_has_properties_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_type_property_unique` UNIQUE(`asset_type_id`,`asset_property_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `booking_form` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`fields` json NOT NULL,
	`conditions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	`asset_type_id` int,
	`tenant_id` varchar(255),
	CONSTRAINT `booking_form_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `category` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`asset_type_id` varchar(255),
	`tenant_id` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `category_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `group` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`tenant_id` varchar(255) NOT NULL,
	`group_type_id` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `group_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `group_type` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`tenant_id` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `group_type_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `asset_property` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`property_type` varchar(255) NOT NULL,
	`tenant_id` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `asset_property_id` PRIMARY KEY(`id`),
	CONSTRAINT `name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `tenant` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`subdomain` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenant_id` PRIMARY KEY(`id`),
	CONSTRAINT `subdomain_unique` UNIQUE(`subdomain`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
	`id` varchar(36) NOT NULL,
	`hashed_token` varchar(255) NOT NULL,
	`device_info` varchar(255),
	`ip_address` varchar(45),
	`revoked` boolean DEFAULT false,
	`tenant_id` varchar(36),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `file` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_url` varchar(255) NOT NULL,
	`file_type` varchar(255) NOT NULL,
	`file_size` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`asset_id` int,
	`tenant_id` varchar(255),
	`maintenance_task_id` int,
	CONSTRAINT `file_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `asset_idx` ON `maintenance_task` (`asset_id`);--> statement-breakpoint
CREATE INDEX `asset_type_idx` ON `asset` (`asset_type_id`);--> statement-breakpoint
CREATE INDEX `group_idx` ON `asset` (`group_id`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `asset` (`owner_id`);--> statement-breakpoint
CREATE INDEX `asset_idx` ON `booking` (`asset_id`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `booking` (`customer_id`);--> statement-breakpoint
CREATE INDEX `asset_type_idx` ON `booking_form` (`asset_type_id`);--> statement-breakpoint
CREATE INDEX `asset_type_idx` ON `category` (`asset_type_id`);--> statement-breakpoint
CREATE INDEX `group_type_idx` ON `group` (`group_type_id`);--> statement-breakpoint
CREATE INDEX `asset_idx` ON `file` (`asset_id`);--> statement-breakpoint
CREATE INDEX `maintenance_task_idx` ON `file` (`maintenance_task_id`);