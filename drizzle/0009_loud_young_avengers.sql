CREATE TABLE `property_favorites` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`property_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_property_favorites_account_property` ON `property_favorites` (`account_id`,`property_id`);--> statement-breakpoint
CREATE INDEX `idx_property_favorites_account_created` ON `property_favorites` (`account_id`,`created_at`);