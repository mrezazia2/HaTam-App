import {and,eq} from 'drizzle-orm';
import {getDb} from '../../../db';
import {accounts,properties} from '../../../db/schema';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{
  const db=getDb(),id=new URL(request.url).searchParams.get('id');
  const [rows,published]=await Promise.all([
   db.select({id:accounts.id,name:accounts.name,address:accounts.address,mobile:accounts.mobile,contactPhone:accounts.contactPhone,avatarKey:accounts.avatarKey,specialty:accounts.specialty,biography:accounts.biography}).from(accounts).where(and(eq(accounts.role,'consultant'),eq(accounts.status,'active'),...(id?[eq(accounts.id,id)]:[]))),
   db.select({consultantAccountId:properties.consultantAccountId}).from(properties).where(eq(properties.status,'published')),
  ]);
  const counts=new Map<string,number>();for(const property of published)if(property.consultantAccountId)counts.set(property.consultantAccountId,(counts.get(property.consultantAccountId)||0)+1);
  const items=rows.map(({avatarKey,...row})=>({...row,mobile:row.contactPhone||row.mobile,address:row.address||'نشانی ثبت نشده',specialty:row.specialty||'مشاور خرید و فروش املاک',activeFiles:counts.get(row.id)||0,rating:null,verified:true,avatar:avatarKey?`/api/account/avatar?id=${encodeURIComponent(row.id)}&v=${encodeURIComponent(avatarKey.split('/').pop()||'')}`:'/assets/hatam/advisor.webp'}));
  if(id&&!items.length)return Response.json({ok:false,error:'CONSULTANT_NOT_FOUND'},{status:404});
  return Response.json(id?{ok:true,item:items[0]}:{ok:true,items},{headers:{'cache-control':'no-store'}});
 }catch{return Response.json({ok:false,error:'CONSULTANTS_UNAVAILABLE'},{status:500})}
}
