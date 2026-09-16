CREATE TABLE `app_menu_items` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`icon` text DEFAULT 'home' NOT NULL,
	`action` text NOT NULL,
	`target` text DEFAULT '' NOT NULL,
	`variant` text DEFAULT 'item' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_app_menu_enabled_order` ON `app_menu_items` (`enabled`,`sort_order`);
