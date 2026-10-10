CREATE TABLE `passkey_credentials` (
 `credential_id` text PRIMARY KEY NOT NULL,
 `account_id` text NOT NULL,
 `public_key` text NOT NULL,
 `counter` integer DEFAULT 0 NOT NULL,
 `transports` text NOT NULL,
 `device_type` text NOT NULL,
 `backed_up` integer DEFAULT 0 NOT NULL,
 `label` text DEFAULT 'قفل دستگاه' NOT NULL,
 `created_at` integer NOT NULL,
 `last_used_at` integer
);
CREATE INDEX `idx_passkey_credentials_account` ON `passkey_credentials` (`account_id`);
CREATE TABLE `passkey_challenges` (
 `id` text PRIMARY KEY NOT NULL,
 `account_id` text NOT NULL,
 `kind` text NOT NULL,
 `challenge` text NOT NULL,
 `origin` text NOT NULL,
 `expires_at` integer NOT NULL,
 `consumed_at` integer,
 `created_at` integer NOT NULL
);
CREATE INDEX `idx_passkey_challenges_account_kind` ON `passkey_challenges` (`account_id`,`kind`);
CREATE INDEX `idx_passkey_challenges_expires` ON `passkey_challenges` (`expires_at`);
