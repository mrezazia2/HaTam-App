import { SqliteBinding } from "/app/runtime/sqlite.mjs";

const db = new SqliteBinding("/app/data/hatam.sqlite");
try {
  const sms = db.connection.prepare("SELECT provider, enabled, public_config, encrypted_secret IS NOT NULL AS has_secret, updated_at FROM integration_settings WHERE category = 'sms'").get();
  const outbox = db.connection.prepare("SELECT status, attempts, last_error, template, created_at FROM sms_outbox ORDER BY created_at DESC LIMIT 12").all();
  const audit = db.connection.prepare("SELECT action, summary, metadata, created_at FROM audit_logs WHERE action LIKE 'sms.%' OR action LIKE 'auth.otp_sms_%' ORDER BY created_at DESC LIMIT 12").all();
  console.log(JSON.stringify({
    sms: sms ? {
      provider: sms.provider,
      enabled: Boolean(sms.enabled),
      publicConfig: JSON.parse(sms.public_config),
      hasSecret: Boolean(sms.has_secret),
      updatedAt: sms.updated_at,
    } : null,
    outbox,
    audit,
  }));
} finally {
  db.close();
}
