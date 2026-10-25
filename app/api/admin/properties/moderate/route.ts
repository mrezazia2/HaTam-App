import {and,eq} from 'drizzle-orm';
import {getDb} from '../../../../../db';
import {properties,propertyMedia,propertyStatusHistory,urgentSaleRequests} from '../../../../../db/schema';
import {requireAdmin,forbidden} from '../../../_lib/authorization';
import {writeAudit} from '../../../_lib/audit';

export async function POST(request:Request){
 const admin=await requireAdmin(request);if(!admin)return forbidden();
 let body;try{body=await request.json()}catch{return Response.json({error:'INVALID_REQUEST'},{status:400})}
 const {id,source,status}=body||{};
 if(typeof id!=='string'||!['published','pending','rejected','archived'].includes(status)||!['property','urgent'].includes(source))return Response.json({error:'INVALID_MODERATION'},{status:400});
 const db=getDb(),now=new Date();
 if(source==='urgent'){
  if(status!=='published')return Response.json({error:'USE_REQUEST_STATUS'},{status:400});
  const row=(await db.select().from(urgentSaleRequests).where(eq(urgentSaleRequests.id,id)).limit(1))[0];
  if(!row)return Response.json({error:'NOT_FOUND'},{status:404});
  const propertyId=`HT-URGENT-${row.id}`,existing=(await db.select().from(properties).where(eq(properties.id,propertyId)).limit(1))[0];
  const media=await db.select().from(propertyMedia).where(and(eq(propertyMedia.urgentSaleId,id),eq(propertyMedia.status,'active')));
  const cover=media.find(x=>x.contentType.startsWith('image/'));
  if(!existing){
   await db.batch([
    db.insert(properties).values({id:propertyId,title:`ملک ${row.area} متری ${row.address}`,ownerAccountId:row.accountId,ownerMobile:row.mobile||'',consultantAccountId:row.assignedConsultantId,address:row.address,latitude:row.latitude,longitude:row.longitude,transactionType:'sale',propertyType:'apartment',area:row.area,bedrooms:row.bedrooms,price:row.expectedPrice,description:JSON.stringify({buildingAge:row.buildingAge,floor:row.floor,unitsPerFloor:row.unitsPerFloor,amenities:row.amenities,sourceUrgentSaleId:row.id}),coverImage:cover?`/api/property-media?key=${encodeURIComponent(cover.objectKey)}`:null,status:'published',createdAt:now,updatedAt:now}).onConflictDoNothing({target:properties.id}),
    db.update(propertyMedia).set({propertyId,updatedAt:now}).where(and(eq(propertyMedia.urgentSaleId,id),eq(propertyMedia.status,'active'))),
    db.insert(propertyStatusHistory).values({id:`PH-${crypto.randomUUID()}`,propertyId,actorAccountId:admin.id,fromStatus:null,toStatus:'published',note:'انتشار درخواست فروش توسط مدیر',createdAt:now}),
   ]);
  }else if(existing.status!=='published'){
   await db.batch([db.update(properties).set({status:'published',updatedAt:now}).where(eq(properties.id,propertyId)),db.insert(propertyStatusHistory).values({id:`PH-${crypto.randomUUID()}`,propertyId,actorAccountId:admin.id,fromStatus:existing.status,toStatus:'published',note:'انتشار مجدد توسط مدیر',createdAt:now})]);
  }
  await writeAudit(db,admin,'properties.publish_urgent','properties',propertyId,'درخواست فروش به آگهی عمومی تبدیل شد.',{urgentSaleId:id});
  return Response.json({ok:true,id:propertyId,status:'published'});
 }
 const row=(await db.select().from(properties).where(eq(properties.id,id)).limit(1))[0];
 if(!row)return Response.json({error:'NOT_FOUND'},{status:404});
 if(row.status!==status){await db.batch([db.update(properties).set({status,updatedAt:now}).where(eq(properties.id,id)),db.insert(propertyStatusHistory).values({id:`PH-${crypto.randomUUID()}`,propertyId:id,actorAccountId:admin.id,fromStatus:row.status,toStatus:status,note:'تصمیم انتشار مدیر',createdAt:now})]);await writeAudit(db,admin,'properties.status','properties',id,'وضعیت ملک تغییر کرد.',{from:row.status,to:status})}
 return Response.json({ok:true,id,status});
}
