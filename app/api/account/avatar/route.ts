import {env} from 'cloudflare:workers';
import {eq} from 'drizzle-orm';
import {getDb} from '../../../../db';
import {accounts} from '../../../../db/schema';
import {getRequestAccount} from '../../_lib/authorization';
import {writeAudit} from '../../_lib/audit';
import {getUploadSettings,validateUpload} from '../../_lib/upload-settings';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get('id')||'',row=(await getDb().select().from(accounts).where(eq(accounts.id,id)).limit(1))[0];
 if(!row?.avatarKey||!env.MEDIA)return new Response('Not found',{status:404});
 if(row.role!=='consultant'||row.status!=='active'){const viewer=await getRequestAccount(request);if(viewer?.id!==id&&viewer?.role!=='admin')return new Response('Forbidden',{status:403})}
 const object=await env.MEDIA.get(row.avatarKey);if(!object)return new Response('Not found',{status:404});
 return new Response(object.body,{headers:{'content-type':`image/${row.avatarKey.endsWith('.jpg')?'jpeg':row.avatarKey.split('.').pop()}`,'x-content-type-options':'nosniff','cache-control':'private, no-store'}});
}
export async function POST(request:Request){
 const account=await getRequestAccount(request);if(!account||account.status!=='active')return Response.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
 if(!env.MEDIA)return Response.json({ok:false,error:'MEDIA_STORAGE_UNAVAILABLE'},{status:503});
 const file=(await request.formData()).get('file');if(!(file instanceof File))return Response.json({ok:false,error:'INVALID_FILE'},{status:400});
 const checked=validateUpload(file,await getUploadSettings(),'property');if(!checked.ok||!['jpg','jpeg','png','webp'].includes(checked.extension)||file.size>5*1024*1024)return Response.json({ok:false,error:'IMAGE_ONLY_MAX_5_MB'},{status:400});
 const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255,png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71,webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if(!(jpg&&['jpg','jpeg'].includes(checked.extension)||png&&checked.extension==='png'||webp&&checked.extension==='webp'))return Response.json({ok:false,error:'INVALID_IMAGE'},{status:400});
 const db=getDb(),old=(await db.select({key:accounts.avatarKey}).from(accounts).where(eq(accounts.id,account.id)).limit(1))[0]?.key,key=`avatars/${account.id}/${crypto.randomUUID()}.${checked.extension==='jpeg'?'jpg':checked.extension}`;
 await env.MEDIA.put(key,file.stream());try{await db.update(accounts).set({avatarKey:key,updatedAt:new Date()}).where(eq(accounts.id,account.id))}catch(e){await env.MEDIA.delete(key);throw e}
 if(old)await env.MEDIA.delete(old);await writeAudit(db,account,'account.avatar_updated','account',account.id,'عکس حساب تغییر کرد.',{size:file.size});
 return Response.json({ok:true,avatar:`/api/account/avatar?id=${encodeURIComponent(account.id)}&v=${encodeURIComponent(key.split('/').pop()!)}`});
}
