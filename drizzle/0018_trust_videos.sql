CREATE TABLE `trust_videos` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trust_videos_object_key_unique` ON `trust_videos` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_trust_videos_enabled_order` ON `trust_videos` (`enabled`,`sort_order`);
