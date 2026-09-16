CREATE TABLE `saved_searches` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`name` text NOT NULL,
	`transaction_type` text,
	`district` text,
	`property_type` text,
	`min_price` integer,
	`max_price` integer,
	`min_area` integer,
	`max_area` integer,
	`min_bedrooms` integer,
	`alerts_enabled` integer DEFAULT true NOT NULL,
	`last_notified_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_saved_searches_account_updated` ON `saved_searches` (`account_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_saved_searches_alerts` ON `saved_searches` (`alerts_enabled`,`last_notified_at`);