CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_account_id` text,
	`actor_role` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`summary` text NOT NULL,
	`metadata` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_created` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_entity` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_actor` ON `audit_logs` (`actor_account_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `communication_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`sms_enabled` integer DEFAULT false NOT NULL,
	`require_vip` integer DEFAULT true NOT NULL,
	`updated_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `communication_policies_account_id_unique` ON `communication_policies` (`account_id`);--> statement-breakpoint
CREATE INDEX `idx_communication_policies_account` ON `communication_policies` (`account_id`);