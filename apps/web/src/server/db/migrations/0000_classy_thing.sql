CREATE TABLE `asset` (
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
CREATE TABLE `asset_has_properties` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`asset_id` int NOT NULL,
	`asset_property_id` int NOT NULL,
	`value` varchar(255) NOT NULL,
	CONSTRAINT `asset_has_properties_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_property_unique` UNIQUE(`asset_id`,`asset_property_id`)
);
--> statement-breakpoint
CREATE TABLE `booking` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`start_date` datetime NOT NULL,
	`end_date` datetime NOT NULL,
	`status` varchar(255) NOT NULL,
	`form_data` json,
	`totalPrice` decimal(1),
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	`asset_id` int NOT NULL,
	`customer_id` varchar(255) NOT NULL,
	`owner_id` varchar(255),
	`booking_form_id` varchar(255) NOT NULL,
	CONSTRAINT `booking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_url` varchar(255) NOT NULL,
	`file_type` varchar(255) NOT NULL,
	`file_size` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`asset_id` int,
	`maintenance_task_id` int,
	CONSTRAINT `file_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`invoice_number` varchar(255) NOT NULL,
	`status` varchar(255) NOT NULL,
	`issue_date` datetime NOT NULL,
	`due_date` datetime NOT NULL,
	`subtotal` decimal(1) NOT NULL,
	`taxAmount` decimal(1) NOT NULL,
	`totalAmount` decimal(1) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	`customer_id` varchar(255) NOT NULL,
	`booking_id` varchar(255) NOT NULL,
	CONSTRAINT `invoice_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoice_number_unique` UNIQUE(`invoice_number`)
);
--> statement-breakpoint
CREATE TABLE `invoice_item` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`description` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(1) NOT NULL,
	`totalPrice` decimal(1) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	`invoice_id` varchar(255) NOT NULL,
	CONSTRAINT `invoice_item_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`amount` decimal NOT NULL,
	`type` varchar(255) NOT NULL,
	`status` varchar(255) NOT NULL,
	`payment_date` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	`booking_id` varchar(255) NOT NULL,
	`customer_id` varchar(255) NOT NULL,
	`invoice_id` varchar(255),
	CONSTRAINT `payment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receipt` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`receipt_number` varchar(255) NOT NULL,
	`issue_date` datetime NOT NULL,
	`totalAmount` decimal(1) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	`invoice_id` varchar(255) NOT NULL,
	`payment_id` varchar(255) NOT NULL,
	CONSTRAINT `receipt_id` PRIMARY KEY(`id`),
	CONSTRAINT `receipt_number_unique` UNIQUE(`receipt_number`)
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
	`asset_id` int NOT NULL,
	`assigned_to_id` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `maintenance_task_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_type` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`booking_form_id` varchar(255),
	`tenant_id` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `asset_type_id` PRIMARY KEY(`id`),
	CONSTRAINT `name_unique` UNIQUE(`name`),
	CONSTRAINT `booking_form_unique` UNIQUE(`booking_form_id`)
);
--> statement-breakpoint
CREATE TABLE `asset_type_has_properties` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`asset_type_id` int NOT NULL,
	`asset_property_id` int NOT NULL,
	`required` boolean NOT NULL DEFAULT false,
	CONSTRAINT `asset_type_has_properties_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_type_property_unique` UNIQUE(`asset_type_id`,`asset_property_id`)
);
--> statement-breakpoint
CREATE TABLE `booking_form` (
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
CREATE TABLE `category` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`schema` json NOT NULL,
	`asset_type_id` varchar(255),
	`tenant_id` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `category_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`group_type_id` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `group_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_type` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`tenant_id` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `group_type_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_property` (
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
CREATE TABLE `tenant` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subdomain` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `tenant_id` PRIMARY KEY(`id`),
	CONSTRAINT `subdomain_unique` UNIQUE(`subdomain`)
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
	`updatedAt` timestamp,
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `customer_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_unique` UNIQUE(`email`),
	CONSTRAINT `user_id_unique` UNIQUE(`user_id`)
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
	`updatedAt` timestamp,
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `owner_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_unique` UNIQUE(`email`),
	CONSTRAINT `user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	`tenant_id` varchar(255),
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `asset_type_idx` ON `asset` (`asset_type_id`);--> statement-breakpoint
CREATE INDEX `group_idx` ON `asset` (`group_id`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `asset` (`owner_id`);--> statement-breakpoint
CREATE INDEX `asset_idx` ON `booking` (`asset_id`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `booking` (`customer_id`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `booking` (`owner_id`);--> statement-breakpoint
CREATE INDEX `booking_form_idx` ON `booking` (`booking_form_id`);--> statement-breakpoint
CREATE INDEX `asset_idx` ON `file` (`asset_id`);--> statement-breakpoint
CREATE INDEX `maintenance_task_idx` ON `file` (`maintenance_task_id`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `invoice` (`customer_id`);--> statement-breakpoint
CREATE INDEX `booking_idx` ON `invoice` (`booking_id`);--> statement-breakpoint
CREATE INDEX `invoice_idx` ON `invoice_item` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `booking_idx` ON `payment` (`booking_id`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `payment` (`customer_id`);--> statement-breakpoint
CREATE INDEX `invoice_idx` ON `payment` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `invoice_idx` ON `receipt` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `payment_idx` ON `receipt` (`payment_id`);--> statement-breakpoint
CREATE INDEX `asset_idx` ON `maintenance_task` (`asset_id`);--> statement-breakpoint
CREATE INDEX `assigned_to_idx` ON `maintenance_task` (`assigned_to_id`);--> statement-breakpoint
CREATE INDEX `asset_type_idx` ON `booking_form` (`asset_type_id`);--> statement-breakpoint
CREATE INDEX `asset_type_idx` ON `category` (`asset_type_id`);--> statement-breakpoint
CREATE INDEX `group_type_idx` ON `group` (`group_type_id`);