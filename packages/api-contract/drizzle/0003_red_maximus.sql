CREATE TABLE `asset_property_options` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`asset_property_id` bigint unsigned NOT NULL,
	`label` varchar(255) NOT NULL,
	`display_order` bigint unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `asset_property_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `asset_properties` MODIFY COLUMN `propertyType` enum('number','string','textbox','list','select','multi_select') NOT NULL;--> statement-breakpoint
ALTER TABLE `asset_property_options` ADD CONSTRAINT `asset_property_options_asset_property_id_asset_properties_id_fk` FOREIGN KEY (`asset_property_id`) REFERENCES `asset_properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `asset_property_option_idx` ON `asset_property_options` (`asset_property_id`);