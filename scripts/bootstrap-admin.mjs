import {randomUUID,pbkdf2Sync} from 'node:crypto';
import {join,resolve} from 'node:path';
import {SqliteBinding} from '../runtime/sqlite.mjs';

// Supply via private environment, never command arguments or committed files.
const mobile=process.env.HATAM_ADMIN_MOBILE||'';
const password=process.env.HATAM_ADMIN_PASSWORD||'';
if(!/^09\d{9}$/.test(mobile)||password.length<12)throw new Error('Set HATAM_ADMIN_MOBILE and HATAM_ADMIN_PASSWORD (12+ characters) securely');
const db=new SqliteBinding(join(resolve(process.env.HATAM_DATA_DIR||'data'),'hatam.sqlite'));
try{
 db.migrate(resolve('drizzle'));
 if(await db.prepare("SELECT id FROM accounts WHERE role='admin' OR mobile=? LIMIT 1").bind(mobile).first())throw new Error('Existing admin or mobile found. Bootstrap will not overwrite accounts.');
 const now=Date.now(),id=`ADM-${randomUUID()}`,salt=randomUUID();
 const hash=`${salt}:${pbkdf2Sync(password,salt,210000,32,'sha256').toString('hex')}`;
 await db.batch([
  db.prepare("INSERT INTO accounts (id,role,name,mobile,password_hash,address,status,created_at,updated_at) VALUES (?,'admin',?,?,?,'','active',?,?)").bind(id,process.env.HATAM_ADMIN_NAME||'مدیر حاتم',mobile,hash,now,now),
  db.prepare("INSERT INTO wallets(id,account_id,balance,currency,created_at,updated_at) VALUES (?,?,0,'IRT',?,?)").bind(`W-${randomUUID()}`,id,now,now),
  db.prepare("INSERT INTO audit_logs(id,actor_account_id,actor_role,action,entity_type,entity_id,summary,metadata,created_at) VALUES (?,?,'system','admin.bootstrap','account',?,'مدیر اولیه ایجاد شد.','{}',?)").bind(`AUD-${randomUUID()}`,id,id,now),
 ]);
 console.log('Initial administrator created. Remove HATAM_ADMIN_PASSWORD from the environment after this one-time operation.');
}finally{db.close();}
