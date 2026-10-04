import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {createHash} from 'node:crypto';

export class SqliteBinding {
  constructor(filename) {
    if(Number(process.versions.node.split('.')[0])<24)throw new Error('VPS SQLite requires Node.js 24 or newer');
    mkdirSync(dirname(filename),{recursive:true});
    this.connection=new DatabaseSync(filename);
    this.connection.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
  }
  prepare(sql) {return new Prepared(this,sql,[]);}
  async batch(statements) {
    // No await inside the transaction: no interleaving between HTTP requests.
    this.connection.exec('BEGIN IMMEDIATE');
    try {const results=statements.map(s=>s.execute());this.connection.exec('COMMIT');return results;}
    catch(error){this.connection.exec('ROLLBACK');throw error;}
  }
  migrate(directory) {
    this.connection.exec('CREATE TABLE IF NOT EXISTS hatam_migrations (name TEXT PRIMARY KEY, hash TEXT NOT NULL, applied_at INTEGER NOT NULL)');
    const journal=JSON.parse(readFileSync(join(directory,'meta','_journal.json'),'utf8'));
    this.connection.exec('BEGIN IMMEDIATE');
    try {
      for(const entry of journal.entries){
        const name=entry.tag;
        if(!/^[a-zA-Z0-9_-]+$/.test(name))throw new Error('INVALID_MIGRATION');
        const source=readFileSync(join(directory,`${name}.sql`),'utf8');
        const hash=createHash('sha256').update(source.replace(/\r\n/g,'\n')).digest('hex');
        const applied=this.connection.prepare('SELECT hash FROM hatam_migrations WHERE name=?').get(name);
        if(applied){if(applied.hash!==hash)throw new Error(`MIGRATION_CHANGED:${name}`);continue;}
        this.connection.exec(source);
        this.connection.prepare('INSERT INTO hatam_migrations VALUES (?,?,?)').run(name,hash,Date.now());
      }
      this.connection.exec('COMMIT');
    } catch(error){this.connection.exec('ROLLBACK');throw error;}
  }
  close(){this.connection.close();}
}
class Prepared {
  constructor(db,sql,values){this.db=db;this.sql=sql;this.values=values;}
  bind(...values){return new Prepared(this.db,this.sql,values);}
  execute(){
    const stmt=this.db.connection.prepare(this.sql);
    const rows=stmt.columns().length?stmt.all(...this.values):null;
    const info=rows?this.db.connection.prepare('SELECT changes() AS changes,last_insert_rowid() AS last_row_id').get():stmt.run(...this.values);
    return {success:true,results:rows||[],meta:{changes:Number(info.changes),last_row_id:Number(info.lastInsertRowid??info.last_row_id??0)}};
  }
  async run(){return this.execute();}
  async all(){return this.execute();}
  async first(column){const row=this.db.connection.prepare(this.sql).get(...this.values);return column?(row?.[column]??null):(row??null);}
  async raw(){const stmt=this.db.connection.prepare(this.sql);stmt.setReturnArrays(true);return stmt.all(...this.values);}
}
