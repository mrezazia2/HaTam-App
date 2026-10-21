CREATE TABLE IF NOT EXISTS chat_read_receipts (
 id text PRIMARY KEY NOT NULL,
 account_id text NOT NULL,
 conversation_id text NOT NULL,
 read_at integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_read_receipt ON chat_read_receipts(account_id, conversation_id);
