CREATE TABLE `booking_form_field_value` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`booking_id` int NOT NULL,
	`form_field_id` int NOT NULL,
	`value` text NOT NULL,
	CONSTRAINT `booking_form_field_value_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `booking_form_field` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`form_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(50) NOT NULL,
	`required` boolean NOT NULL,
	CONSTRAINT `booking_form_field_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `refresh_tokens` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `refresh_tokens` MODIFY COLUMN `user_id` varchar(36);--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD PRIMARY KEY(`id`);--> statement-breakpoint
CREATE INDEX `booking_idx` ON `booking_form_field_value` (`booking_id`);--> statement-breakpoint
CREATE INDEX `form_field_idx` ON `booking_form_field_value` (`form_field_id`);--> statement-breakpoint
CREATE INDEX `form_idx` ON `booking_form_field` (`form_id`);--> statement-breakpoint
ALTER TABLE `booking` DROP COLUMN `form_data`;--> statement-breakpoint
ALTER TABLE `booking_form` DROP COLUMN `fields`;--> statement-breakpoint
ALTER TABLE `booking_form` DROP COLUMN `conditions`;