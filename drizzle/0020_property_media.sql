CREATE TABLE `property_media` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`owner_account_id` text NOT NULL,
	`property_id` text,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_property_media_object_key` ON `property_media` (`object_key`);
--> statement-breakpoint
CREATE INDEX `idx_property_media_owner_created` ON `property_media` (`owner_account_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `idx_property_media_property_status` ON `property_media` (`property_id`,`status`);
