CREATE TABLE `auth_security_events` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`identifier_hash` text NOT NULL,
	`ip_hash` text NOT NULL,
	`success` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_auth_events_identifier_action_created` ON `auth_security_events` (`identifier_hash`,`action`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_auth_events_ip_action_created` ON `auth_security_events` (`ip_hash`,`action`,`created_at`);