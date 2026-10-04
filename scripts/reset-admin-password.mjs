import { createHash, pbkdf2Sync, randomUUID } from "node:crypto";
import { join, resolve } from "node:path";
import { SqliteBinding } from "../runtime/sqlite.mjs";

const mobile = process.env.HATAM_ADMIN_MOBILE || "";
let passwordInput = "";
for await (const chunk of process.stdin) passwordInput += chunk;
const password = passwordInput.trim();
if (!/^09\d{9}$/.test(mobile) || password.length < 12) {
  throw new Error("Provide HATAM_ADMIN_MOBILE and pipe a 12+ character password through stdin");
}

const db = new SqliteBinding(join(resolve(process.env.HATAM_DATA_DIR || "data"), "hatam.sqlite"));
try {
  const account = await db.prepare("SELECT id, role FROM accounts WHERE mobile=? LIMIT 1").bind(mobile).first();
  if (!account || account.role !== "admin") throw new Error("Administrator account not found");

  const now = Date.now();
  const salt = randomUUID();
  const passwordHash = `${salt}:${pbkdf2Sync(password, salt, 210000, 32, "sha256").toString("hex")}`;
  const authSecret = process.env.AUTH_SECRET || "";
  if (authSecret.length < 32) throw new Error("AUTH_SECRET is unavailable");
  const identifierHash = createHash("sha256").update(`${authSecret}:auth-id:${mobile}`).digest("hex");

  await db.batch([
    db.prepare("UPDATE accounts SET password_hash=?, status='active', updated_at=? WHERE id=?").bind(passwordHash, now, account.id),
    db.prepare("DELETE FROM sessions WHERE account_id=?").bind(account.id),
    db.prepare("DELETE FROM auth_security_events WHERE action='password_login' AND identifier_hash=?").bind(identifierHash),
    db.prepare("INSERT INTO audit_logs(id,actor_account_id,actor_role,action,entity_type,entity_id,summary,metadata,created_at) VALUES (?,?,'system','admin.password_reset','account',?,'رمز مدیر از مسیر امن بازنشانی شد.','{}',?)").bind(`AUD-${randomUUID()}`, account.id, account.id, now),
  ]);
  console.log("Administrator password reset completed; prior sessions and this account's test throttle were cleared.");
} finally {
  db.close();
}
