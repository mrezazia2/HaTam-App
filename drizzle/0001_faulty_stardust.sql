CREATE INDEX `idx_accounts_role_status` ON `accounts` (`role`,`status`);--> statement-breakpoint
CREATE INDEX `idx_consultations_customer_status` ON `consultations` (`customer_account_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_consultations_consultant_status` ON `consultations` (`consultant_account_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_content_blocks_page_order` ON `content_blocks` (`page_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `idx_properties_status_district` ON `properties` (`status`,`district`);--> statement-breakpoint
CREATE INDEX `idx_properties_owner` ON `properties` (`owner_account_id`);--> statement-breakpoint
CREATE INDEX `idx_visits_property_scheduled` ON `visits` (`property_id`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `idx_visits_customer_status` ON `visits` (`customer_account_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_wallet_transactions_wallet_created` ON `wallet_transactions` (`wallet_id`,`created_at`);