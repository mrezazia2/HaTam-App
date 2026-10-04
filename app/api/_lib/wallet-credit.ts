type Statement = { sql: string; values: (string | number)[] };
type Common = { id: string; actorId: string; actorRole: string; now: number; transactionId: string; auditId: string };

// Execute as one transactional batch. Each step only runs if its predecessor
// changed exactly one row. The ledger and balance cannot commit independently.
export function walletCreditStatements(x: Common & (
  { kind: "receipt"; decision: "approved" | "rejected"; note: string } |
  { kind: "payment"; reference: string; callback: Record<string,string> }
)): Statement[] {
  const receipt = x.kind === "receipt";
  const table = receipt ? "card_transfer_receipts" : "payment_intents";
  const prefix = receipt ? "receipt" : "payment";
  const decision = receipt ? x.decision : "paid";
  const credits = decision !== "rejected";
  const walletExists = `EXISTS (SELECT 1 FROM wallets w WHERE w.id=${table}.wallet_id AND w.account_id=${table}.account_id AND ${table}.amount>0 AND typeof(${table}.amount)='integer' AND w.balance<=9007199254740991-${table}.amount)`;
  const statements: Statement[] = receipt ? [{
    sql: `UPDATE card_transfer_receipts SET status=?,reviewed_by=?,review_note=?,updated_at=? WHERE id=? AND status='pending' AND ${walletExists}`,
    values:[decision,x.actorId,x.note,x.now,x.id],
  }] : [{
    sql: `UPDATE payment_intents SET status='paid',provider_reference=?,callback_payload=?,verified_at=?,updated_at=? WHERE id=? AND status IN ('redirected','failed','cancelled') AND purpose='wallet_topup' AND ${walletExists}`,
    values:[x.reference,JSON.stringify(x.callback),x.now,x.now,x.id],
  }];
  if (credits) {
    statements.push({
      sql:`UPDATE wallets SET balance=balance+(SELECT amount FROM ${table} WHERE id=?),updated_at=? WHERE id=(SELECT wallet_id FROM ${table} WHERE id=?) AND changes()=1`,
      values:[x.id,x.now,x.id],
    },{
      sql:`INSERT INTO wallet_transactions (id,wallet_id,type,amount,status,reference,description,created_at) SELECT ?,wallet_id,'credit',amount,'completed',?,?,? FROM ${table} WHERE id=? AND changes()=1`,
      values:[x.transactionId,`${prefix}:${x.id}`,receipt ? "تأیید واریز کارت‌به‌کارت" : "افزایش موجودی از درگاه آنلاین",x.now,x.id],
    });
  }
  statements.push({
    sql:`INSERT INTO audit_logs (id,actor_account_id,actor_role,action,entity_type,entity_id,summary,metadata,created_at) SELECT ?,?,?,?,?,?,?,?,? WHERE changes()=1`,
    values:[x.auditId,x.actorId,x.actorRole,receipt ? "finance.receipt.review" : "payment.verified",receipt ? "card_transfer_receipt" : "payment_intent",x.id,credits ? "شارژ کیف پول ثبت شد." : "رسید رد شد.",JSON.stringify({status:decision}),x.now],
  });
  return statements;
}
