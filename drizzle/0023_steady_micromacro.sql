ALTER TABLE `reminders` ADD `locked_at` integer;--> statement-breakpoint
ALTER TABLE `reminders` ADD `lock_token` text;--> statement-breakpoint
ALTER TABLE `sms_outbox` ADD `next_attempt_at` integer;--> statement-breakpoint
ALTER TABLE `sms_outbox` ADD `locked_at` integer;--> statement-breakpoint
ALTER TABLE `sms_outbox` ADD `lock_token` text;--> statement-breakpoint
CREATE INDEX `idx_sms_outbox_status_next_attempt` ON `sms_outbox` (`status`,`next_attempt_at`);