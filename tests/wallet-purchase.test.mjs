import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { walletPurchaseStatements } from '../app/api/_lib/wallet-purchase.ts';

function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE wallets (id TEXT PRIMARY KEY, account_id TEXT, balance INTEGER, updated_at INTEGER);
    CREATE TABLE wallet_transactions (id TEXT PRIMARY KEY, wallet_id TEXT, type TEXT, amount INTEGER, status TEXT, reference TEXT UNIQUE, description TEXT, created_at INTEGER);
    CREATE TABLE subscriptions (id TEXT PRIMARY KEY, account_id TEXT, plan_id TEXT, status TEXT, starts_at INTEGER, expires_at INTEGER, auto_renew INTEGER, created_at INTEGER, updated_at INTEGER);
    CREATE TABLE audit_logs (id TEXT PRIMARY KEY, actor_account_id TEXT, actor_role TEXT, action TEXT, entity_type TEXT, entity_id TEXT, summary TEXT, metadata TEXT, created_at INTEGER);
    INSERT INTO wallets VALUES ('wallet', 'owner', 100, 0);`);
  return db;
}
const input = {walletId:'wallet', accountId:'owner', role:'user', planId:'plan', planName:'VIP', amount:80, durationDays:30, subscriptionId:'s1', transactionId:'t1', auditId:'a1', now:1000};
function purchase(db, values = input) {
  db.exec('BEGIN');
  try {
    const results = walletPurchaseStatements(values).map(({sql, values}) => db.prepare(sql).run(...values));
    db.exec('COMMIT');
    return results[0].changes;
  } catch(error) { db.exec('ROLLBACK'); throw error; }
}
test('two queued purchases cannot spend the same balance', () => {
  const db=fixture();
  try {
    assert.equal(purchase(db),1);
    assert.equal(purchase(db,{...input,subscriptionId:'s2',transactionId:'t2',auditId:'a2'}),0);
    assert.equal(db.prepare('SELECT balance FROM wallets').get().balance,20);
    for(const table of ['subscriptions','wallet_transactions','audit_logs']) assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n,1);
  } finally {db.close();}
});
test('failure after debit rolls the entire purchase back', () => {
  const db=fixture();
  try {
    db.exec("INSERT INTO subscriptions (id) VALUES ('s1')");
    assert.throws(()=>purchase(db));
    assert.equal(db.prepare('SELECT balance FROM wallets').get().balance,100);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM wallet_transactions').get().n,0);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM audit_logs').get().n,0);
  } finally {db.close();}
});
test('a different account cannot debit the wallet', () => {
  const db=fixture();
  try {
    assert.equal(purchase(db,{...input,accountId:'other'}),0);
    assert.equal(db.prepare('SELECT balance FROM wallets').get().balance,100);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM subscriptions').get().n,0);
  } finally {db.close();}
});
