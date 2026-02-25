ALTER TABLE `tags` ADD `slug` varchar(255);--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `tag_slug_unique` UNIQUE(`slug`,`tenant_id`);