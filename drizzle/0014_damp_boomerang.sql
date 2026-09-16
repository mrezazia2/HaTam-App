CREATE TABLE `property_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`request_type` text NOT NULL,
	`customer_account_id` text NOT NULL,
	`consultant_account_id` text,
	`property_id` text,
	`title` text NOT NULL,
	`district` text,
	`min_budget` integer,
	`max_budget` integer,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_property_requests_customer_status` ON `property_requests` (`customer_account_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_property_requests_consultant_status` ON `property_requests` (`consultant_account_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_property_requests_created` ON `property_requests` (`created_at`);