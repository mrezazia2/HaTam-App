import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,randomBytes,sign} from 'node:crypto';
import {mkdtemp} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {SqliteBinding} from '../runtime/sqlite.mjs';

const b64=value=>Buffer.from(value).toString('base64url');
const digest=value=>createHash('sha256').update(value).digest();
function cbor(value){
 if(typeof value==='number'){if(value>=0)return value<24?Buffer.from([value]):Buffer.from([24,value]);const n=-1-value;return n<24?Buffer.from([0x20+n]):Buffer.from([0x38,n])}
 if(typeof value==='string'){const bytes=Buffer.from(value);return Buffer.concat([head(3,bytes.length),bytes])}
 if(Buffer.isBuffer(value))return Buffer.concat([head(2,value.length),value]);
 if(value instanceof Map)return Buffer.concat([head(5,value.size),...Array.from(value.entries()).flatMap(([k,v])=>[cbor(k),cbor(v)])]);
 throw new Error('Unsupported test CBOR value');
}
function head(major,length){return length<24?Buffer.from([(major<<5)+length]):Buffer.from([(major<<5)+24,length])}
function clientData(type,challenge,origin){return b64(Buffer.from(JSON.stringify({type,challenge,origin,crossOrigin:false})))}

test('Passkey: enroll, sign in, reject replay and foreign origin, revoke',async()=>{
 process.env.NODE_ENV='production';
 process.env.VINEXT_TRUST_PROXY='1';
 process.env.VINEXT_TRUSTED_HOSTS='web.hatamestate.com';
 process.env.AUTH_SECRET=randomBytes(32).toString('hex');
 process.env.INTEGRATION_SECRET_KEY=randomBytes(32).toString('hex');
 process.env.AUTOMATION_SECRET=randomBytes(32).toString('hex');
 process.env.HATAM_DATA_DIR=await mkdtemp(join(tmpdir(),'hatam-passkey-'));
 const db=new SqliteBinding(join(process.env.HATAM_DATA_DIR,'hatam.sqlite'));
 db.migrate(resolve('drizzle'));
 const now=Date.now(),token=randomBytes(32).toString('hex'),mobile='09120009999';
 await db.prepare("INSERT INTO accounts(id,role,name,mobile,status,created_at,updated_at) VALUES ('passkey-user','user','Test passkey',?,'active',?,?)").bind(mobile,now,now).run();
 await db.prepare('INSERT INTO sessions(id,account_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)').bind('passkey-setup','passkey-user',createHash('sha256').update(`${process.env.AUTH_SECRET}:${token}`).digest('hex'),now+600000,now).run();
 const {startProdServer}=await import('../node_modules/vinext/dist/server/prod-server.js');
 const {server,port}=await startProdServer({host:'127.0.0.1',port:0,outDir:resolve('dist')});
 const origin='https://web.hatamestate.com',forwarded={'host':'web.hatamestate.com','x-forwarded-host':'web.hatamestate.com','x-forwarded-proto':'https'};
 const request=(path,body,cookie,requestOrigin=origin)=>fetch(`http://127.0.0.1:${port}${path}`,{method:'POST',redirect:'manual',headers:{...forwarded,origin:requestOrigin,'content-type':'application/json',...(cookie?{cookie}: {})},body:JSON.stringify(body)});
 const cookie=`hatam_session=${token}`;
 try{
  const foreign=await request('/api/auth/passkeys/register',{action:'begin'},cookie,'https://evil.example');assert.equal(foreign.status,403);
  const unauth=await request('/api/auth/passkeys/register',{action:'begin'});assert.equal(unauth.status,401);
  const diagnosticBegin=await request('/api/auth/passkeys/register',{action:'begin'},cookie);assert.equal(diagnosticBegin.status,200);
  const diagnostic=(await diagnosticBegin.json()).challengeId;
  const reported=await request('/api/auth/passkeys/register',{action:'client-error',challengeId:diagnostic,name:'NotAllowedError',code:'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY'},cookie);assert.equal(reported.status,200);
  const repeatedReport=await request('/api/auth/passkeys/register',{action:'client-error',challengeId:diagnostic,name:'NotAllowedError'},cookie);assert.equal(repeatedReport.status,400);
  assert.equal((await db.prepare("SELECT COUNT(*) total FROM audit_logs WHERE action='auth.passkey_client_failed'").first()).total,1);
  const begin=await request('/api/auth/passkeys/register',{action:'begin'},cookie);assert.equal(begin.status,200,await begin.clone().text());
  const registration=await begin.json(),credentialId=randomBytes(32),{publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  assert.equal(registration.options.authenticatorSelection.residentKey,'required');
  assert.equal(registration.options.authenticatorSelection.userVerification,'required');
  assert.equal(registration.options.timeout,120000);
  const jwk=publicKey.export({format:'jwk'}),cose=cbor(new Map([[1,2],[3,-7],[-1,1],[-2,Buffer.from(jwk.x,'base64url')],[-3,Buffer.from(jwk.y,'base64url')]]));
  const rpHash=digest('hatamestate.com'),authData=Buffer.concat([rpHash,Buffer.from([0x45]),Buffer.from([0,0,0,0]),Buffer.alloc(16),Buffer.from([0,credentialId.length]),credentialId,cose]);
  const attestation=cbor(new Map([['fmt','none'],['attStmt',new Map()],['authData',authData]]));
  const credential=b64(credentialId),registrationResponse={id:credential,rawId:credential,type:'public-key',authenticatorAttachment:'platform',response:{clientDataJSON:clientData('webauthn.create',registration.options.challenge,origin),attestationObject:b64(attestation),transports:['internal']},clientExtensionResults:{}};
  const finish=await request('/api/auth/passkeys/register',{action:'finish',challengeId:registration.challengeId,response:registrationResponse},cookie);assert.equal(finish.status,200,await finish.clone().text());
  const replayRegistration=await request('/api/auth/passkeys/register',{action:'finish',challengeId:registration.challengeId,response:registrationResponse},cookie);assert.equal(replayRegistration.status,400);
  const listed=await fetch(`http://127.0.0.1:${port}/api/auth/passkeys`,{headers:{...forwarded,cookie}});assert.equal(listed.status,200);assert.equal((await listed.json()).items.length,1);
  const wrongRole=await request('/api/auth/passkeys/login',{action:'begin',mobile,role:'agency'});assert.equal(wrongRole.status,404);
  const authBegin=await request('/api/auth/passkeys/login',{action:'begin',mobile,role:'user'});assert.equal(authBegin.status,200,await authBegin.clone().text());
  const authentication=await authBegin.json(),authenticatorData=Buffer.concat([rpHash,Buffer.from([0x05]),Buffer.from([0,0,0,1])]),signedData=clientData('webauthn.get',authentication.options.challenge,origin);
  const signature=sign('sha256',Buffer.concat([authenticatorData,digest(Buffer.from(signedData,'base64url'))]),privateKey);
  const authResponse={id:credential,rawId:credential,type:'public-key',authenticatorAttachment:'platform',response:{authenticatorData:b64(authenticatorData),clientDataJSON:signedData,signature:b64(signature),userHandle:null},clientExtensionResults:{}};
  const login=await request('/api/auth/passkeys/login',{action:'finish',challengeId:authentication.challengeId,response:authResponse});assert.equal(login.status,200,await login.clone().text());assert.match(login.headers.get('set-cookie')||'',/hatam_session=/);
  const replay=await request('/api/auth/passkeys/login',{action:'finish',challengeId:authentication.challengeId,response:authResponse});assert.equal(replay.status,400);
  const removed=await fetch(`http://127.0.0.1:${port}/api/auth/passkeys`,{method:'DELETE',headers:{...forwarded,origin,cookie,'content-type':'application/json'},body:JSON.stringify({id:credential})});assert.equal(removed.status,200,await removed.clone().text());
  const afterRemoval=await request('/api/auth/passkeys/login',{action:'begin',mobile,role:'user'});assert.equal(afterRemoval.status,404);
  assert.equal((await db.prepare("SELECT COUNT(*) total FROM audit_logs WHERE action IN ('auth.passkey_registered','auth.passkey_signed_in','auth.passkey_removed')").first()).total,3);
 }finally{await new Promise(resolve=>server.close(resolve));db.close()}
});
