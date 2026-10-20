ALTER TABLE accounts ADD COLUMN avatar_key text;
--> statement-breakpoint
ALTER TABLE accounts ADD COLUMN specialty text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE accounts ADD COLUMN biography text NOT NULL DEFAULT '';
