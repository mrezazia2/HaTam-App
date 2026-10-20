import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {SqliteBinding} from '../runtime/sqlite.mjs';
test('cooperation migration preserves legacy applications and leaves the original archive intact',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'hatam-cooperation-')),db=new SqliteBinding(join(directory,'test.sqlite'));
 try{const journal=JSON.parse(await readFile('drizzle/meta/_journal.json','utf8'));for(const entry of journal.entries.filter(x=>x.idx<30))db.connection.exec(await readFile(resolve('drizzle',`${entry.tag}.sql`),'utf8'));
 const legacy=[{id:'CO-old',firstName:'Legacy',mobile:'09120000000',createdAt:'2026-10-01T00:00:00Z'}];
 await db.prepare('INSERT INTO app_configurations(id,value,created_at,updated_at) VALUES (?,?,?,?)').bind('cooperate-applications',JSON.stringify(legacy),1,1).run();
 db.connection.exec(await readFile('drizzle/0030_cooperate_applications.sql','utf8'));
 assert.equal((await db.prepare("SELECT COUNT(*) total FROM cooperate_applications WHERE id='CO-old'").first()).total,1);
 assert.equal(JSON.parse((await db.prepare("SELECT payload FROM cooperate_applications WHERE id='CO-old'").first()).payload).firstName,'Legacy');
 assert.equal(JSON.parse((await db.prepare("SELECT value FROM app_configurations WHERE id='cooperate-applications'").first()).value).length,1);
 }finally{db.close()}
});
