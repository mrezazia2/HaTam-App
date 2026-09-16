// Executed in order in one D1 batch transaction. changes() binds each insert
// to the immediately preceding statement, so insufficient funds write nothing.
export function walletPurchaseStatements(input: {
  walletId: string; accountId: string; role: string; planId: string;
  planName: string; amount: number; durationDays: number; subscriptionId: string;
  transactionId: string; auditId: string; now: number;
}) {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0 ||
      !Number.isSafeInteger(input.durationDays) || input.durationDays <= 0) {
    throw new Error("INVALID_PLAN");
  }
  const expiresAt = input.now + input.durationDays * 86400000;
  return [
    { sql: "UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ? AND account_id = ? AND balance >= ?",
      values: [input.amount, input.now, input.walletId, input.accountId, input.amount] },
    { sql: "INSERT INTO wallet_transactions (id, wallet_id, type, amount, status, reference, description, created_at) SELECT ?, ?, 'debit', ?, 'completed', ?, ?, ? WHERE changes() = 1",
      values: [input.transactionId, input.walletId, input.amount, input.subscriptionId, `خرید اشتراک ${input.planName}`, input.now] },
    { sql: "INSERT INTO subscriptions (id, account_id, plan_id, status, starts_at, expires_at, auto_renew, created_at, updated_at) SELECT ?, ?, ?, 'active', ?, ?, 0, ?, ? WHERE changes() = 1",
      values: [input.subscriptionId, input.accountId, input.planId, input.now, expiresAt, input.now, input.now] },
    { sql: "INSERT INTO audit_logs (id, actor_account_id, actor_role, action, entity_type, entity_id, summary, metadata, created_at) SELECT ?, ?, ?, 'subscription.wallet_paid', 'subscription', ?, ?, ?, ? WHERE changes() = 1",
      values: [input.auditId, input.accountId, input.role, input.subscriptionId, "اشتراک از کیف پول خریداری شد.", JSON.stringify({ planId: input.planId, amount: input.amount }), input.now] },
  ];
}
