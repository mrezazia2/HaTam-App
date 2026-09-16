CREATE TABLE `subscription_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`audience` text NOT NULL,
	`price` integer NOT NULL,
	`duration_days` integer NOT NULL,
	`features` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_subscription_plans_audience_active` ON `subscription_plans` (`audience`,`active`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`payment_intent_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`starts_at` integer,
	`expires_at` integer,
	`auto_renew` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_subscriptions_account_status` ON `subscriptions` (`account_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_subscriptions_expiry` ON `subscriptions` (`status`,`expires_at`);