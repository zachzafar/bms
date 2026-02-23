CREATE TABLE `asset_location` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`asset_id` varchar(36) NOT NULL,
	`address` varchar(500),
	`lat` decimal(10,7),
	`lng` decimal(10,7),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `asset_location_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_location_unique` UNIQUE(`asset_id`)
);
--> statement-breakpoint
ALTER TABLE `asset_location` ADD CONSTRAINT `asset_location_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;