DROP INDEX `idx_payment_intents_authority`;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_payment_intents_authority` ON `payment_intents` (`authority`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_payment_intents_provider_reference` ON `payment_intents` (`provider`,`provider_reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_card_receipts_account_tracking` ON `card_transfer_receipts` (`account_id`,`tracking_code`);