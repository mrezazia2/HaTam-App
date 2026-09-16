type Statement = { sql: string; values: (string | number)[] };
type RequestInput = { id: string; walletId: string; accountId: string; role: string; amount: number; iban: string; now: number; transactionId: string; auditId: string };
function audit(id: string, actor: string, role: string, settlement: string, action: string, now: number): Statement {
  return {sql: "INSERT INTO audit_logs (id,actor_account_id,actor_role,action,entity_type,entity_id,summary,metadata,created_at) SELECT ?,?,?,?,'settlement',?,?,'{}',? WHERE changes()=1", values:[id,actor,role,action,settlement,"وضعیت تسویه به‌روزرسانی شد.",now]};
}

// All statements must run in one transactional D1 batch, in this order.
export function reserveSettlement(x: RequestInput): Statement[] {
  if (!Number.isSafeInteger(x.amount) || x.amount <= 0) throw new Error("INVALID_AMOUNT");
  return [
    {sql:"UPDATE wallets SET balance=balance-?,updated_at=? WHERE id=? AND account_id=? AND balance>=?",values:[x.amount,x.now,x.walletId,x.accountId,x.amount]},
    {sql:"INSERT INTO settlements (id,account_id,wallet_id,amount,iban,status,created_at,updated_at) SELECT ?,?,?,?,?,'requested',?,? WHERE changes()=1",values:[x.id,x.accountId,x.walletId,x.amount,x.iban,x.now,x.now]},
    {sql:"INSERT INTO wallet_transactions (id,wallet_id,type,amount,status,reference,description,created_at) SELECT ?,?,'hold',?,'pending',?,'رزرو مبلغ تسویه',? WHERE changes()=1",values:[x.transactionId,x.walletId,x.amount,`reserve:${x.id}`,x.now]},
    audit(x.auditId,x.accountId,x.role,x.id,"finance.settlement.requested",x.now),
  ];
}

export function reviewSettlement(x: {id:string; status:"approved"|"rejected"|"paid"; adminId:string; reference:string; now:number; auditId:string; transactionId:string}): Statement[] {
  const held = "EXISTS (SELECT 1 FROM wallet_transactions t WHERE t.reference='reserve:'||settlements.id AND t.wallet_id=settlements.wallet_id AND t.amount=settlements.amount AND t.type='hold' AND t.status='pending')";
  const guard = x.status === "paid" ? `status='approved' AND ${held}` : x.status === "approved" ? `status='requested' AND ${held}` : "status IN ('requested','approved')";
  const statements: Statement[] = [{sql:`UPDATE settlements SET status=?,reviewed_by=?,reference=?,updated_at=? WHERE id=? AND ${guard}`,values:[x.status,x.adminId,x.reference,x.now,x.id]}];
  if (x.status === "rejected") {
    // Legacy holds never reduced balance; rejecting those must not mint money.
    statements.push({sql:"UPDATE wallets SET balance=balance+COALESCE((SELECT amount FROM wallet_transactions WHERE reference=? AND type='hold' AND status='pending' AND wallet_id=wallets.id),0),updated_at=? WHERE id=(SELECT wallet_id FROM settlements WHERE id=?) AND changes()=1",values:[`reserve:${x.id}`,x.now,x.id]});
  }
  statements.push(audit(x.auditId,x.adminId,"admin",x.id,`finance.settlement.${x.status}`,x.now));
  if (x.status !== "approved") {
    statements.push({sql:"UPDATE wallet_transactions SET status=? WHERE reference=? AND type='hold' AND status='pending' AND changes()=1",values:[x.status === "paid" ? "completed" : "failed",`reserve:${x.id}`]});
    statements.push({sql:"INSERT INTO wallet_transactions (id,wallet_id,type,amount,status,reference,description,created_at) SELECT ?,wallet_id,?,amount,'completed',?,?,? FROM settlements WHERE id=? AND changes()=1",values:[x.transactionId,x.status === "paid" ? "debit" : "release",`${x.status === "paid" ? "settlement" : "release"}:${x.id}`,x.status === "paid" ? "پرداخت از مبلغ رزروشده تسویه" : "آزادسازی مبلغ تسویه ردشده",x.now,x.id]});
  }
  return statements;
}
