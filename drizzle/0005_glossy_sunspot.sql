CREATE TABLE `conversation_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`account_id` text NOT NULL,
	`role` text NOT NULL,
	`last_read_at` integer,
	`joined_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_conversation_participants_account` ON `conversation_participants` (`account_id`);--> statement-breakpoint
CREATE INDEX `idx_conversation_participants_conversation` ON `conversation_participants` (`conversation_id`);--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`subject` text NOT NULL,
	`property_id` text,
	`agency_id` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_conversations_agency_updated` ON `conversations` (`agency_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_account_id` text NOT NULL,
	`body` text NOT NULL,
	`moderation_status` text DEFAULT 'visible' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_messages_conversation_created` ON `messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`link` text,
	`read_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_account_created` ON `notifications` (`account_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_notifications_account_read` ON `notifications` (`account_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`event_type` text NOT NULL,
	`event_id` text NOT NULL,
	`channel` text NOT NULL,
	`scheduled_at` integer NOT NULL,
	`sent_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_reminders_status_scheduled` ON `reminders` (`status`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `idx_reminders_account` ON `reminders` (`account_id`);--> statement-breakpoint
CREATE TABLE `sms_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`mobile` text NOT NULL,
	`template` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` integer NOT NULL,
	`sent_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_sms_outbox_status_created` ON `sms_outbox` (`status`,`created_at`);