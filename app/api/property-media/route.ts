import {env} from "cloudflare:workers";
import {and,eq} from "drizzle-orm";
import {getDb} from "../../../db";
import {properties,propertyMedia} from "../../../db/schema";
import {getRequestAccount} from "../_lib/authorization";
import {writeAudit} from "../_lib/audit";

const allowed=new Set(["image/jpeg","image/png","image/webp","video/mp4","video/webm","video/quicktime"]);
const local=(url:URL)=>url.hostname==="localhost"||url.hostname==="127.0.0.1";

export async function POST(request:Request){
 const account=await getRequestAccount(request);if(!account||account.status!=="active")return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});if(!env.MEDIA)return Response.json({ok:false,error:"MEDIA_STORAGE_UNAVAILABLE"},{status:503});
 const data=await request.formData(),file=data.get("file");if(!(file instanceof File)||!allowed.has(file.type))return Response.json({ok:false,error:"INVALID_FILE"},{status:400});const max=file.type.startsWith("video/")?100*1024*1024:15*1024*1024;if(file.size<=0||file.size>max)return Response.json({ok:false,error:"FILE_TOO_LARGE"},{status:400});
 const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-").slice(-120)||"media",key=`properties/${account.id}/${crypto.randomUUID()}-${safe}`,id=`PM-${crypto.randomUUID()}`,now=new Date(),db=getDb();
 await env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType:file.type},customMetadata:{ownerAccountId:account.id,mediaId:id}});
 try{await db.insert(propertyMedia).values({id,objectKey:key,ownerAccountId:account.id,propertyId:null,fileName:file.name.slice(0,240),contentType:file.type,size:file.size,status:"active",createdAt:now,updatedAt:now});await writeAudit(db,account,"property_media.uploaded","property_media",id,"رسانه ملک بارگذاری شد.",{contentType:file.type,size:file.size})}catch(error){await env.MEDIA.delete(key);throw error}
 const preview=local(new URL(request.url))?`&previewRole=${encodeURIComponent(account.role)}`:"";return Response.json({ok:true,item:{key,url:`/api/property-media?key=${encodeURIComponent(key)}${preview}`,name:file.name,type:file.type,size:file.size}},{status:201});
}

export async function GET(request:Request){
 const url=new URL(request.url),key=url.searchParams.get("key")||"";if(!key.startsWith("properties/")||!env.MEDIA)return new Response("Not found",{status:404});const db=getDb(),record=(await db.select().from(propertyMedia).where(and(eq(propertyMedia.objectKey,key),eq(propertyMedia.status,"active"))).limit(1))[0];if(!record)return new Response("Not found",{status:404});
 let isPublic=false;if(record.propertyId){const property=(await db.select({status:properties.status}).from(properties).where(eq(properties.id,record.propertyId)).limit(1))[0];isPublic=property?.status==="published"}
 if(!isPublic){const headers=new Headers(request.headers);if(local(url)&&url.searchParams.get("previewRole"))headers.set("x-hatam-preview-role",url.searchParams.get("previewRole")!);const account=await getRequestAccount(new Request(url.toString(),{headers}));if(!account||(account.role!=="admin"&&account.id!==record.ownerAccountId))return new Response("Forbidden",{status:403})}
 const object=await env.MEDIA.get(key);if(!object)return new Response("Not found",{status:404});return new Response(object.body,{headers:{"content-type":record.contentType,"content-length":String(record.size),"cache-control":isPublic?"public, max-age=86400":"private, no-store","x-content-type-options":"nosniff"}});
}

export async function DELETE(request:Request){
 const account=await getRequestAccount(request),key=new URL(request.url).searchParams.get("key")||"";if(!account||account.status!=="active")return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});const db=getDb(),record=(await db.select().from(propertyMedia).where(and(eq(propertyMedia.objectKey,key),eq(propertyMedia.status,"active"))).limit(1))[0];if(!record)return Response.json({ok:true});if(account.role!=="admin"&&record.ownerAccountId!==account.id)return Response.json({ok:false,error:"FORBIDDEN"},{status:403});if(record.propertyId&&account.role!=="admin"){const property=(await db.select({status:properties.status}).from(properties).where(eq(properties.id,record.propertyId)).limit(1))[0];if(property?.status==="published")return Response.json({ok:false,error:"PUBLISHED_MEDIA_LOCKED"},{status:409})}
 if(env.MEDIA)await env.MEDIA.delete(key);await db.update(propertyMedia).set({status:"deleted",updatedAt:new Date()}).where(eq(propertyMedia.id,record.id));await writeAudit(db,account,"property_media.deleted","property_media",record.id,"رسانه ملک حذف شد.",{propertyId:record.propertyId});return Response.json({ok:true});
}
