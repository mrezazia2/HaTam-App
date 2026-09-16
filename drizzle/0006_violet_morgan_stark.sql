CREATE TABLE `card_transfer_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`wallet_id` text NOT NULL,
	`amount` integer NOT NULL,
	`tracking_code` text NOT NULL,
	`receipt_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` text,
	`review_note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_card_receipts_status_created` ON `card_transfer_receipts` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_card_receipts_account` ON `card_transfer_receipts` (`account_id`);--> statement-breakpoint
CREATE TABLE `payment_intents` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`wallet_id` text NOT NULL,
	`amount` integer NOT NULL,
	`provider` text NOT NULL,
	`authority` text,
	`status` text DEFAULT 'created' NOT NULL,
	`callback_payload` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_payment_intents_account_status` ON `payment_intents` (`account_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_payment_intents_authority` ON `payment_intents` (`authority`);--> statement-breakpoint
CREATE TABLE `settlements` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`wallet_id` text NOT NULL,
	`amount` integer NOT NULL,
	`iban` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`reference` text,
	`reviewed_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_settlements_status_created` ON `settlements` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_settlements_account` ON `settlements` (`account_id`);