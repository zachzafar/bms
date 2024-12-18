ALTER TABLE `customer` RENAME COLUMN `updatedAt` TO `updated_at`;--> statement-breakpoint
ALTER TABLE `owner` RENAME COLUMN `updatedAt` TO `updated_at`;--> statement-breakpoint
ALTER TABLE `user` RENAME COLUMN `updatedAt` TO `updated_at`;--> statement-breakpoint
ALTER TABLE `maintenance_task` RENAME COLUMN `updatedAt` TO `updated_at`;--> statement-breakpoint
ALTER TABLE `asset` RENAME COLUMN `updatedAt` TO `updated_at`;--> statement-breakpoint
ALTER TABLE `booking` RENAME COLUMN `updatedAt` TO `updated_at`;--> statement-breakpoint
ALTER TABLE `booking_form` RENAME COLUMN `updatedAt` TO `updated_at`;--> statement-breakpoint
ALTER TABLE `category` RENAME COLUMN `updatedAt` TO `updated_at`;--> statement-breakpoint
ALTER TABLE `group` RENAME COLUMN `updatedAt` TO `updated_at`;--> statement-breakpoint
ALTER TABLE `refresh_tokens` RENAME COLUMN `updatedAt` TO `user_id`;--> statement-breakpoint
ALTER TABLE `refresh_tokens` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `id` varchar(36) NOT NULL DEFAULT 'uuid()';--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `updated_at` timestamp;--> statement-breakpoint
ALTER TABLE `tenant` MODIFY COLUMN `id` varchar(36) NOT NULL DEFAULT 'uuid()';--> statement-breakpoint
ALTER TABLE `tenant` MODIFY COLUMN `updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `refresh_tokens` MODIFY COLUMN `id` serial AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `refresh_tokens` MODIFY COLUMN `user_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD PRIMARY KEY(`id`,`user_id`);--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD `updated_at` timestamp;