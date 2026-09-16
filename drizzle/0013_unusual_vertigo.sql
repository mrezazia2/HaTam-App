CREATE TABLE `communication_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`sms_pattern` text DEFAULT '' NOT NULL,
	`link` text DEFAULT '/panel' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `communication_templates_key_unique` ON `communication_templates` (`key`);--> statement-breakpoint
CREATE TABLE `reminder_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`label` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`lead_minutes` integer DEFAULT 120 NOT NULL,
	`channel` text DEFAULT 'both' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reminder_rules_event_type_unique` ON `reminder_rules` (`event_type`);