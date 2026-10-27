import {eq} from 'drizzle-orm';
import {getDb} from '../../../../db';
import {accounts,agencies,properties,urgentSaleRequests,propertyRequests,appConfigurations} from '../../../../db/schema';
import {requireAdmin,forbidden} from '../../_lib/authorization';
const sections=['properties','customers','consultants','agencies','urgent-sales','requests'] as const;
export async function GET(request:Request){
 const admin=await requireAdmin(request);if(!admin)return forbidden();
 const snapshot=Date.now(),db=getDb();
 const [a,g,p,u,r]=await Promise.all([db.select({role:accounts.role,createdAt:accounts.createdAt}).from(accounts),db.select({createdAt:agencies.createdAt}).from(agencies),db.select({createdAt:properties.createdAt}).from(properties),db.select({createdAt:urgentSaleRequests.createdAt}).from(urgentSaleRequests),db.select({createdAt:propertyRequests.createdAt}).from(propertyRequests)]);
 const rows={properties:[...p,...u],customers:a.filter(x=>x.role==='user'),consultants:a.filter(x=>x.role==='consultant'),agencies:g,'urgent-sales':u,requests:r};
 const records=await db.select().from(appConfigurations);const counts:Record<string,number>={};
 for(const section of sections){const value=records.find(x=>x.id===`archive-seen:${admin.id}:${section}`)?.value as {through?:number}|undefined;counts[section]=rows[section].filter(x=>x.createdAt.getTime()>(value?.through||0)).length}
 return Response.json({counts,snapshot},{headers:{'cache-control':'no-store'}});
}
export async function POST(request:Request){
 const admin=await requireAdmin(request);if(!admin)return forbidden();let body;try{body=await request.json()}catch{return Response.json({error:'INVALID_REQUEST'},{status:400})}
 if(!body||!sections.includes(body.section)||!Number.isSafeInteger(body.through)||body.through<0||body.through>Date.now())return Response.json({error:'INVALID_SECTION'},{status:400});
 const db=getDb(),id=`archive-seen:${admin.id}:${body.section}`,now=new Date();
 const current=(await db.select().from(appConfigurations).where(eq(appConfigurations.id,id)).limit(1))[0]?.value as {through?:number}|undefined;
 const value={through:Math.max(current?.through||0,body.through)};
 await db.insert(appConfigurations).values({id,value,createdAt:now,updatedAt:now}).onConflictDoUpdate({target:appConfigurations.id,set:{value,updatedAt:now}});
 return Response.json({ok:true});
}
