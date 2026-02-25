CREATE TABLE `asset_has_tags` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`asset_id` varchar(36) NOT NULL,
	`tag_id` bigint unsigned NOT NULL,
	CONSTRAINT `asset_has_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_tag_unique` UNIQUE(`asset_id`,`tag_id`)
);
--> statement-breakpoint
ALTER TABLE `asset_has_tags` ADD CONSTRAINT `asset_has_tags_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_tags` ADD CONSTRAINT `asset_has_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;