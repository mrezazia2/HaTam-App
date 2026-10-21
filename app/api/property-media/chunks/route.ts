import {env} from 'cloudflare:workers';
import {and,eq,like} from 'drizzle-orm';
import {getDb} from '../../../../db';
import {appConfigurations,propertyMedia} from '../../../../db/schema';
import {getRequestAccount} from '../../_lib/authorization';
import {getUploadSettings,validateUpload} from '../../_lib/upload-settings';
import {trustedMutation} from '../../../auth/security';
import {writeAudit} from '../../_lib/audit';
const partSize=4*1024*1024;
type Upload={owner:string;name:string;type:string;size:number;parts:number;expires:number;state:string;item?:Record<string,unknown>};
export async function POST(request:Request){
 if(!trustedMutation(request))return Response.json({error:'UNTRUSTED_ORIGIN'},{status:403});
 const account=await getRequestAccount(request);
 if(!account||account.status!=='active')return Response.json({error:'AUTH_REQUIRED'},{status:401});
 if(!env.MEDIA)return Response.json({error:'MEDIA_STORAGE_UNAVAILABLE'},{status:503});
 const db=getDb(),url=new URL(request.url),action=url.searchParams.get('action');
 if(action==='init'){
  let input;try{input=await request.json()}catch{return Response.json({error:'INVALID_FILE'},{status:400})}
  const size=Number(input.size),name=String(input.name||'').slice(0,240),type=String(input.type||'');
  if(!Number.isSafeInteger(size)||!name)return Response.json({error:'INVALID_FILE'},{status:400});
  const validation=validateUpload({name,type,size} as File,await getUploadSettings(),'property');
  if(!validation.ok)return Response.json({error:validation.error},{status:400});
  const rows=await db.select().from(appConfigurations).where(like(appConfigurations.id,`upload-${account.id}-%`));
  for(const row of rows){const old=row.value as unknown as Upload;if(old.expires<Date.now()){
   await Promise.all(Array.from({length:old.parts},(_,i)=>env.MEDIA!.delete(`${row.id}/${i}`)));
   await db.delete(appConfigurations).where(eq(appConfigurations.id,row.id));
  }}
  if(rows.filter(row=>Number(row.value.expires)>Date.now()&&row.value.state!=='complete').length>=3)return Response.json({error:'UPLOAD_LIMIT'},{status:429});
  const id=`upload-${account.id}-${crypto.randomUUID()}`,value:Upload={owner:account.id,name,type:type||(validation.category==='image'?'image/jpeg':'video/mp4'),size,parts:Math.ceil(size/partSize),expires:Date.now()+60*60_000,state:'open'},now=new Date();
  await db.insert(appConfigurations).values({id,value:value as unknown as Record<string,unknown>,createdAt:now,updatedAt:now});
  return Response.json({id,partSize,parts:value.parts});
 }
 const id=url.searchParams.get('id')||'';
 if(!id.startsWith(`upload-${account.id}-`))return Response.json({error:'NOT_FOUND'},{status:404});
 const row=(await db.select().from(appConfigurations).where(eq(appConfigurations.id,id)).limit(1))[0];
 const upload=row?.value as unknown as Upload;
 if(!upload||upload.owner!==account.id||upload.expires<Date.now()||(upload.state!=='open'&&action!=='status'&&action!=='complete'))return Response.json({error:'UPLOAD_EXPIRED'},{status:409});
 if(action==='status'||action==='complete'&&upload.state==='complete'){if(upload.item)return Response.json({item:upload.item});const completed:number[]=[];for(let i=0;i<upload.parts;i++){const part=await env.MEDIA.get(`${id}/${i}`);if(part){if(part.size===Math.min(partSize,upload.size-i*partSize))completed.push(i);await part.body.cancel()}}return Response.json({completed,parts:upload.parts,partSize})}
 if(upload.state!=='open')return Response.json({error:'UPLOAD_BUSY'},{status:409});
 if(action==='part'){
  const index=Number(url.searchParams.get('part'));
  if(!Number.isInteger(index)||index<0||index>=upload.parts)return Response.json({error:'INVALID_PART'},{status:400});
  const expected=Math.min(partSize,upload.size-index*partSize);
  if(Number(request.headers.get('content-length'))>expected)return Response.json({error:'INVALID_PART'},{status:400});
  if(!request.body)return Response.json({error:'INVALID_PART'},{status:400});
  const reader=request.body.getReader(),chunks:ArrayBuffer[]=[];let length=0;
  while(true){const result=await reader.read();if(result.done)break;length+=result.value.byteLength;if(length>expected){await reader.cancel();return Response.json({error:'INVALID_PART'},{status:400})}chunks.push(new Uint8Array(result.value).buffer)}
  if(length!==expected)return Response.json({error:'INVALID_PART'},{status:400});
  await env.MEDIA.put(`${id}/${index}`,new Blob(chunks).stream());return Response.json({ok:true});
 }
 if(action!=='complete')return Response.json({error:'INVALID_ACTION'},{status:400});
 const locked=await db.update(appConfigurations).set({value:{...row.value,state:'finalizing'}}).where(and(eq(appConfigurations.id,id),eq(appConfigurations.value,row.value))).returning();
 if(!locked.length)return Response.json({error:'UPLOAD_BUSY'},{status:409});
 const key=`properties/${account.id}/${crypto.randomUUID()}-${upload.name.replace(/[^a-zA-Z0-9._-]/g,'-').slice(-120)}`,mediaId=`PM-${crypto.randomUUID()}`;
 try{
  for(let i=0;i<upload.parts;i++){const part=await env.MEDIA.get(`${id}/${i}`);if(!part)throw Error('MISSING_PART');await part.body.cancel();if(part.size!==Math.min(partSize,upload.size-i*partSize))throw Error('MISSING_PART')}
  let index=0,current:ReadableStreamDefaultReader<Uint8Array>|null=null;
  const stream=new ReadableStream<Uint8Array>({async pull(controller){while(true){if(!current){if(index===upload.parts){controller.close();return}const part=await env.MEDIA!.get(`${id}/${index++}`);if(!part)throw Error('MISSING_PART');current=part.body.getReader()}const next=await current!.read();if(next.done){current=null;continue}controller.enqueue(next.value);return}},async cancel(){await current?.cancel()}});
  await env.MEDIA.put(key,stream,{httpMetadata:{contentType:upload.type}});
  const now=new Date();await db.insert(propertyMedia).values({id:mediaId,objectKey:key,ownerAccountId:account.id,fileName:upload.name,contentType:upload.type||'video/mp4',size:upload.size,status:'active',createdAt:now,updatedAt:now});
  await writeAudit(db,account,'property_media.uploaded','property_media',mediaId,'رسانه ملک به صورت تکه‌ای بارگذاری شد.',{size:upload.size,parts:upload.parts});
  await Promise.all(Array.from({length:upload.parts},(_,i)=>env.MEDIA!.delete(`${id}/${i}`)));await db.update(appConfigurations).set({value:{...row.value,state:'complete',item:{key,url:`/api/property-media?key=${encodeURIComponent(key)}`,name:upload.name,type:upload.type||'video/mp4',size:upload.size}}}).where(eq(appConfigurations.id,id));
  return Response.json({item:{key,url:`/api/property-media?key=${encodeURIComponent(key)}`,name:upload.name,type:upload.type||'video/mp4',size:upload.size}},{status:201});
 }catch{
  await env.MEDIA.delete(key);await db.delete(propertyMedia).where(eq(propertyMedia.id,mediaId));
  await db.update(appConfigurations).set({value:{...row.value,state:'open'}}).where(eq(appConfigurations.id,id));
  return Response.json({error:'UPLOAD_INCOMPLETE'},{status:409});
 }
}
