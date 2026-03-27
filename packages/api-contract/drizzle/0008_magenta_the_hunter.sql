ALTER TABLE `rate` ADD `start_month` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `rate` ADD `start_day` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `rate` ADD `end_month` int NOT NULL DEFAULT 12;--> statement-breakpoint
ALTER TABLE `rate` ADD `end_day` int NOT NULL DEFAULT 31;--> statement-breakpoint
UPDATE `rate` SET `start_month` = MONTH(`start_date`), `start_day` = DAY(`start_date`), `end_month` = MONTH(`end_date`), `end_day` = DAY(`end_date`);--> statement-breakpoint
ALTER TABLE `rate` DROP COLUMN `start_date`;--> statement-breakpoint
ALTER TABLE `rate` DROP COLUMN `end_date`;