ALTER TABLE `contracts` ADD `customer_account_id` text;
--> statement-breakpoint
ALTER TABLE `contracts` ADD `customer_mobile` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `contracts` ADD `signing_at` integer;
--> statement-breakpoint
ALTER TABLE `contracts` ADD `notes` text DEFAULT '' NOT NULL;
--> statement-breakpoint
CREATE INDEX `idx_contracts_customer` ON `contracts` (`customer_account_id`);
--> statement-breakpoint
CREATE INDEX `idx_contracts_signing` ON `contracts` (`signing_at`);
--> statement-breakpoint
CREATE TABLE `contract_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`contract_id` text NOT NULL,
	`object_key` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contract_documents_object_key_unique` ON `contract_documents` (`object_key`);
--> statement-breakpoint
CREATE INDEX `idx_contract_documents_contract_status` ON `contract_documents` (`contract_id`,`status`);
