ALTER TABLE `payment_intents` ADD `purpose` text DEFAULT 'wallet_topup' NOT NULL;--> statement-breakpoint
ALTER TABLE `payment_intents` ADD `reference_id` text;--> statement-breakpoint
ALTER TABLE `payment_intents` ADD `provider_reference` text;--> statement-breakpoint
ALTER TABLE `payment_intents` ADD `verified_at` integer;--> statement-breakpoint
CREATE INDEX `idx_payment_intents_reference` ON `payment_intents` (`purpose`,`reference_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_wallet_transactions_reference` ON `wallet_transactions` (`reference`);