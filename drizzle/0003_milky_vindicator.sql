CREATE TABLE `property_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`actor_account_id` text,
	`from_status` text,
	`to_status` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_property_history_property_created` ON `property_status_history` (`property_id`,`created_at`);