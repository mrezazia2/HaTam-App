CREATE TABLE `integration_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`provider` text DEFAULT '' NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`public_config` text NOT NULL,
	`encrypted_secret` text,
	`secret_hint` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `integration_settings_category_unique` ON `integration_settings` (`category`);