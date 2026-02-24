ALTER TABLE `assets` ADD `slug` varchar(255);--> statement-breakpoint
ALTER TABLE `asset_type` ADD `slug` varchar(255);--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `asset_slug_tenant_unique` UNIQUE(`slug`,`tenant_id`);--> statement-breakpoint
ALTER TABLE `asset_type` ADD CONSTRAINT `asset_type_slug_tenant_unique` UNIQUE(`slug`,`tenant_id`);