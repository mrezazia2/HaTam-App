CREATE TABLE `urgent_sale_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`mobile` text,
	`address` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`area` integer NOT NULL,
	`bedrooms` integer DEFAULT 0 NOT NULL,
	`building_age` integer NOT NULL,
	`floor` integer DEFAULT 0 NOT NULL,
	`units_per_floor` integer DEFAULT 1 NOT NULL,
	`amenities` text NOT NULL,
	`expected_price` integer NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`assigned_consultant_id` text,
	`assigned_consultant_name` text DEFAULT '' NOT NULL,
	`consultant_access` text DEFAULT 'view' NOT NULL,
	`admin_note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_urgent_sales_status_created` ON `urgent_sale_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_urgent_sales_consultant` ON `urgent_sale_requests` (`assigned_consultant_id`);