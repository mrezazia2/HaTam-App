CREATE TABLE `agency_members` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`account_id` text NOT NULL,
	`title` text DEFAULT 'مشاور' NOT NULL,
	`status` text DEFAULT 'invited' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_agency_members_agency_status` ON `agency_members` (`agency_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_agency_members_account` ON `agency_members` (`account_id`);--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`property_id` text,
	`consultant_account_id` text,
	`customer_name` text NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_contracts_agency_status` ON `contracts` (`agency_id`,`status`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`consultant_account_id` text,
	`name` text NOT NULL,
	`mobile` text NOT NULL,
	`request` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_leads_agency_status` ON `leads` (`agency_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_leads_consultant` ON `leads` (`consultant_account_id`);