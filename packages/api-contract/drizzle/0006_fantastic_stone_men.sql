CREATE TABLE `owner_magic_links` (
	`id` varchar(36) NOT NULL,
	`owner_id` bigint unsigned NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`used_at` timestamp,
	CONSTRAINT `owner_magic_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `owner_details` ADD CONSTRAINT `owner_tenant_email_idx` UNIQUE(`tenant_id`,`email`);--> statement-breakpoint
ALTER TABLE `owner_magic_links` ADD CONSTRAINT `owner_magic_links_owner_id_owner_details_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `owner_details`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `oml_owner_id_idx` ON `owner_magic_links` (`owner_id`);--> statement-breakpoint
CREATE INDEX `oml_token_idx` ON `owner_magic_links` (`token`);