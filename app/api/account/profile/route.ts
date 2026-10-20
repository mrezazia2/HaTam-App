import {eq} from 'drizzle-orm';
import {getDb} from '../../../../db';
import {accounts} from '../../../../db/schema';
import {getRequestAccount} from '../../_lib/authorization';
import {writeAudit} from '../../_lib/audit';
export const dynamic='force-dynamic';
async function profile(id:string){const row=(await getDb().select({id:accounts.id,name:accounts.name,mobile:accounts.mobile,address:accounts.address,role:accounts.role,status:accounts.status,specialty:accounts.specialty,biography:accounts.biography,avatarKey:accounts.avatarKey}).from(accounts).where(eq(accounts.id,id)).limit(1))[0];if(!row)return null;const {avatarKey,...rest}=row;return {...rest,avatar:avatarKey?`/api/account/avatar?id=${encodeURIComponent(id)}&v=${encodeURIComponent(avatarKey.split('/').pop()||'')}`:'/assets/hatam/advisor.webp'}}
export async function GET(request:Request){const account=await getRequestAccount(request);if(!account)return Response.json({ok:false,error:'AUTH_REQUIRED'},{status:401});return Response.json({ok:true,profile:await profile(account.id)},{headers:{'cache-control':'no-store'}})}
export async function PATCH(request:Request){
 const account=await getRequestAccount(request);if(!account||account.status!=='active')return Response.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
 let value;try{value=await request.json()}catch{return Response.json({ok:false,error:'INVALID_PROFILE'},{status:400})}
 const name=String(value.name||'').trim(),address=String(value.address||'').trim(),specialty=String(value.specialty||'').trim(),biography=String(value.biography||'').trim();
 if(name.length<2||name.length>100||address.length>500||specialty.length>120||biography.length>2000)return Response.json({ok:false,error:'INVALID_PROFILE'},{status:400});
 const db=getDb();await db.update(accounts).set({name,address,...(account.role==='consultant'?{specialty,biography}:{}),updatedAt:new Date()}).where(eq(accounts.id,account.id));
 await writeAudit(db,account,'account.profile_updated','account',account.id,'اطلاعات پروفایل به‌روزرسانی شد.',{nameChanged:name!==account.name});
 return Response.json({ok:true,profile:await profile(account.id)});
}
