CREATE TABLE `tenant_has_users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `tenant_has_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_idx` UNIQUE(`tenant_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `availability` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`asset_id` int NOT NULL,
	`date` int NOT NULL,
	`price` decimal(1),
	`available` boolean NOT NULL,
	CONSTRAINT `availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `asset` MODIFY COLUMN `asset_type_id` int;--> statement-breakpoint
ALTER TABLE `asset` MODIFY COLUMN `tenant_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `asset` ADD `available` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `asset_idx` ON `availability` (`asset_id`);--> statement-breakpoint
ALTER TABLE `asset` DROP COLUMN `status`;