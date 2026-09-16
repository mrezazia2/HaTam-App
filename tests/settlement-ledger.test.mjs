import assert from 'node:assert/strict';
import test from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {reserveSettlement,reviewSettlement} from '../app/api/_lib/settlement-ledger.ts';
import {walletPurchaseStatements} from '../app/api/_lib/wallet-purchase.ts';

function fixture(){
 const db=new DatabaseSync(':memory:');
 // Use the actual table declarations, including their NOT NULL constraints.
 for(const [file,tables] of [['0000_careful_salo.sql',['wallets','wallet_transactions']],['0007_youthful_iron_fist.sql',['subscriptions']],['0012_absurd_shocker.sql',['audit_logs']]]){
  const source=readFileSync(new URL(`../drizzle/${file}`,import.meta.url),'utf8');
  for(const table of tables){const declaration=source.match(new RegExp('CREATE TABLE `'+table+'` \\([\\s\\S]*?\\);'));assert.ok(declaration);db.exec(declaration[0]);}
 }
 db.exec(`CREATE TABLE settlements (id TEXT PRIMARY KEY,account_id TEXT NOT NULL,wallet_id TEXT NOT NULL,amount INTEGER NOT NULL,iban TEXT NOT NULL,status TEXT NOT NULL,reviewed_by TEXT,reference TEXT,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
 CREATE UNIQUE INDEX uq_reference ON wallet_transactions(reference);
 INSERT INTO wallets VALUES ('w','owner',100,'IRT',0,0);`);
 return db;
}
const input={id:'s',walletId:'w',accountId:'owner',role:'consultant',amount:80,iban:'IR000000000000000000000000',now:1000,transactionId:'t',auditId:'a'};
function batch(db,statements){db.exec('BEGIN');try{const result=statements.map(s=>db.prepare(s.sql).run(...s.values));db.exec('COMMIT');return result[0].changes;}catch(e){db.exec('ROLLBACK');throw e;}}
function review(status,suffix=status){return reviewSettlement({id:'s',status,adminId:'admin',reference:'ref',now:2000,auditId:`a-${suffix}`,transactionId:`t-${suffix}`});}
const balance=db=>db.prepare('SELECT balance FROM wallets').get().balance;
test('reserve blocks another reservation and subscription using the same funds',()=>{
 const db=fixture();try{
  assert.equal(batch(db,reserveSettlement(input)),1);assert.equal(balance(db),20);
  assert.equal(batch(db,reserveSettlement({...input,id:'s2',transactionId:'t2',auditId:'a2'})),0);
  assert.equal(batch(db,walletPurchaseStatements({walletId:'w',accountId:'owner',role:'consultant',planId:'p',planName:'VIP',amount:30,durationDays:30,subscriptionId:'sub',transactionId:'ts',auditId:'as',now:1000})),0);
 }finally{db.close();}
});
test('reject releases once, including after approval',()=>{
 const db=fixture();try{
  batch(db,reserveSettlement(input));batch(db,review('approved'));
  assert.equal(batch(db,review('rejected')),1);assert.equal(balance(db),100);
  assert.equal(batch(db,review('rejected','repeat')),0);assert.equal(balance(db),100);
  assert.equal(batch(db,review('paid')),0);
 }finally{db.close();}
});
test('payment consumes reserved amount without a second debit or later refund',()=>{
 const db=fixture();try{
  batch(db,reserveSettlement(input));assert.equal(batch(db,review('paid','early')),0);
  batch(db,review('approved'));assert.equal(batch(db,review('paid')),1);
  assert.equal(balance(db),20);assert.equal(batch(db,review('paid','repeat')),0);
  assert.equal(batch(db,review('rejected')),0);assert.equal(balance(db),20);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM wallet_transactions WHERE type='debit'").get().n,1);
 }finally{db.close();}
});
test('legacy unreserved request cannot be paid and rejection does not credit funds',()=>{
 const db=fixture();try{
  db.exec("INSERT INTO settlements VALUES ('s','owner','w',80,'IR0','requested',NULL,NULL,0,0)");
  assert.equal(batch(db,review('approved')),0);assert.equal(batch(db,review('paid')),0);
  assert.equal(batch(db,review('rejected')),1);assert.equal(balance(db),100);
 }finally{db.close();}
});
test('audit failure rolls reservation and balance back',()=>{
 const db=fixture();try{
  db.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT,'test'); END");
  assert.throws(()=>batch(db,reserveSettlement(input)));assert.equal(balance(db),100);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM settlements').get().n,0);
 }finally{db.close();}
});
