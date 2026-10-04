import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {walletCreditStatements} from '../app/api/_lib/wallet-credit.ts';

function fixture(){
 const db=new DatabaseSync(':memory:');
 for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort()) db.exec(readFileSync(new URL(`../drizzle/${name}`,import.meta.url),'utf8'));
 db.exec(`INSERT INTO wallets(id,account_id,balance,currency,created_at,updated_at) VALUES ('w','u',10,'IRT',0,0);
 INSERT INTO card_transfer_receipts(id,account_id,wallet_id,amount,tracking_code,status,created_at,updated_at) VALUES ('r','u','w',80,'receipt1','pending',0,0);
 INSERT INTO payment_intents(id,account_id,wallet_id,amount,purpose,provider,authority,status,created_at,updated_at) VALUES ('p','u','w',90,'wallet_topup','test','auth1','redirected',0,0);`);
 return db;
}
function run(db,input){db.exec('BEGIN');try{const rows=walletCreditStatements(input).map(s=>db.prepare(s.sql).run(...s.values));db.exec('COMMIT');return rows[0].changes;}catch(e){db.exec('ROLLBACK');throw e;}}
const base={actorId:'admin',actorRole:'admin',now:1000,transactionId:'t',auditId:'a'};
const receipt={...base,kind:'receipt',id:'r',decision:'approved',note:''};
const payment={...base,kind:'payment',id:'p',reference:'bank1',callback:{Authority:'auth1'}};
const balance=db=>db.prepare("SELECT balance FROM wallets WHERE id='w'").get().balance;
for(const [name,input,expected] of [['receipt',receipt,90],['payment',payment,100]])test(`${name}: updates balance once and rejects replay`,()=>{
 const db=fixture();try{assert.equal(run(db,input),1);assert.equal(balance(db),expected);assert.equal(run(db,{...input,transactionId:'t2',auditId:'a2'}),0);assert.equal(balance(db),expected);assert.equal(db.prepare('SELECT count(*) n FROM wallet_transactions').get().n,1);assert.equal(db.prepare('SELECT count(*) n FROM audit_logs').get().n,1);}finally{db.close();}
});
test('rejection cannot undo approval; rejected receipt cannot later credit',()=>{
 const db=fixture();try{assert.equal(run(db,{...receipt,decision:'rejected'}),1);assert.equal(run(db,receipt),0);assert.equal(balance(db),10);}finally{db.close();}
 const db2=fixture();try{run(db2,receipt);assert.equal(run(db2,{...receipt,decision:'rejected',auditId:'a2'}),0);assert.equal(balance(db2),90);}finally{db2.close();}
});
test('ledger conflict rolls back status and balance',()=>{
 const db=fixture();try{db.exec("CREATE TRIGGER fail_credit BEFORE INSERT ON wallet_transactions BEGIN SELECT RAISE(ABORT,'injected'); END");assert.throws(()=>run(db,payment));assert.equal(balance(db),10);assert.equal(db.prepare("SELECT status FROM payment_intents WHERE id='p'").get().status,'redirected');assert.equal(db.prepare('SELECT count(*) n FROM audit_logs').get().n,0);}finally{db.close();}
});
test('mismatched owner cannot receive credit',()=>{
 const db=fixture();try{db.exec("UPDATE wallets SET account_id='other'");assert.equal(run(db,payment),0);assert.equal(balance(db),10);}finally{db.close();}
});
