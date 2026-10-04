import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {SqliteBinding} from '../runtime/sqlite.mjs';
import {DiskMedia} from '../runtime/media.mjs';
import {walletCreditStatements} from '../app/api/_lib/wallet-credit.ts';

test('VPS SQLite migrates once and runs transactional credit batch',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'hatam-db-'));const db=new SqliteBinding(join(directory,'test.sqlite'));
 try{
  db.migrate(resolve('drizzle'));db.migrate(resolve('drizzle'));
  await db.prepare("INSERT INTO wallets VALUES ('w','u',10,'IRT',0,0)").run();
  await db.prepare("INSERT INTO card_transfer_receipts(id,account_id,wallet_id,amount,tracking_code,status,created_at,updated_at) VALUES ('r','u','w',80,'test','pending',0,0)").run();
  const sql=walletCreditStatements({kind:'receipt',id:'r',decision:'approved',note:'',actorId:'a',actorRole:'admin',transactionId:'t',auditId:'log',now:100});
  await db.batch(sql.map(s=>db.prepare(s.sql).bind(...s.values)));
  assert.equal(await db.prepare("SELECT balance FROM wallets WHERE id='w'").first('balance'),90);
  assert.equal((await db.prepare('SELECT id,balance FROM wallets').raw())[0][1],90);
  await assert.rejects(db.batch([db.prepare("UPDATE wallets SET balance=0"),db.prepare('INSERT INTO missing_table VALUES (1)')]));
  assert.equal(await db.prepare('SELECT balance FROM wallets').first('balance'),90);
 }finally{db.close();await rm(directory,{recursive:true,force:true});}
});
test('VPS media persists bytes and rejects path traversal',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'hatam-media-'));const media=new DiskMedia(directory);
 try{
  for(const key of ['../secret','/etc/passwd','x/../../secret','x\\file'])assert.throws(()=>media.path(key));
  await media.put('properties/u/photo.jpg',new Blob(['example']).stream());
  assert.equal(await new Response((await media.get('properties/u/photo.jpg')).body).text(),'example');
  await media.delete('properties/u/photo.jpg');assert.equal(await media.get('properties/u/photo.jpg'),null);
 }finally{await rm(directory,{recursive:true,force:true});}
});
