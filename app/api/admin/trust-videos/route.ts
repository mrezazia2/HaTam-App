import {env} from "cloudflare:workers";
import {asc,eq} from "drizzle-orm";
import {getDb} from "../../../../db";
import {trustVideos} from "../../../../db/schema";
import {forbidden,requireAdmin} from "../../_lib/authorization";
import {writeAudit} from "../../_lib/audit";
import {getUploadSettings,validateUpload} from "../../_lib/upload-settings";

export const dynamic="force-dynamic";
export async function GET(request:Request){if(!await requireAdmin(request))return forbidden();const rows=await getDb().select().from(trustVideos).orderBy(asc(trustVideos.sortOrder));return Response.json({ok:true,items:rows.map(row=>({...row,url:`/api/trust-videos/${row.id}`}))})}
export async function POST(request:Request){
 const admin=await requireAdmin(request);if(!admin)return forbidden();
 const bucket=env.MEDIA;if(!bucket)return Response.json({ok:false,error:"MEDIA_STORAGE_UNAVAILABLE"},{status:503});
 let form:FormData;try{form=await request.formData()}catch{return Response.json({ok:false,error:"INVALID_MULTIPART"},{status:400})}
 const file=form.get("video");if(!(file instanceof File))return Response.json({ok:false,error:"VIDEO_REQUIRED"},{status:400});
 const settings=await getUploadSettings(),validation=validateUpload(file,settings,"video");
 if(!validation.ok)return Response.json({ok:false,error:validation.error,...("maxMb" in validation?{maxMb:validation.maxMb}:{})},{status:400});
 if(!["mp4","webm","mov"].includes(validation.extension))return Response.json({ok:false,error:"FILE_TYPE_NOT_ALLOWED"},{status:400});
 const contentType=({mp4:"video/mp4",webm:"video/webm",mov:"video/quicktime",m4v:"video/mp4",avi:"video/x-msvideo",mkv:"video/x-matroska"} as Record<string,string>)[validation.extension];
 if(file.type && file.type!=="application/octet-stream" && file.type!==contentType && !(validation.extension==="mov"&&file.type==="video/mp4"))return Response.json({ok:false,error:"FILE_TYPE_MISMATCH"},{status:400});
 const id=`TV-${crypto.randomUUID()}`,key=`trust/${id}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"-")}`,now=new Date(),db=getDb();
 try{await bucket.put(key,file.stream(),{httpMetadata:{contentType}});await db.insert(trustVideos).values({id,title:String(form.get("title")||file.name).trim().slice(0,160),objectKey:key,contentType,size:file.size,enabled:true,sortOrder:Number(form.get("sortOrder"))||Date.now(),createdAt:now,updatedAt:now})}catch(error){await bucket.delete(key).catch(()=>{});console.error("trust video upload failed",error);return Response.json({ok:false,error:"UPLOAD_STORAGE_FAILED"},{status:503})}
 await writeAudit(db,admin,"trust_video.upload","trust_video",id,"ویدیوی رضایت مشتری بارگذاری شد.",{fileName:file.name,size:file.size});return Response.json({ok:true,id},{status:201});
}
export async function PATCH(request:Request){const admin=await requireAdmin(request);if(!admin)return forbidden();const value=await request.json() as {id?:string;title?:string;enabled?:boolean;sortOrder?:number},id=String(value.id||"");if(!id)return Response.json({ok:false,error:"ID_REQUIRED"},{status:400});const db=getDb();await db.update(trustVideos).set({title:String(value.title||"ویدیوی رضایت مشتری"),enabled:value.enabled!==false,sortOrder:Number(value.sortOrder)||0,updatedAt:new Date()}).where(eq(trustVideos.id,id));await writeAudit(db,admin,"trust_video.update","trust_video",id,"تنظیمات ویدیوی رضایت مشتری ویرایش شد.",{});return Response.json({ok:true})}
export async function DELETE(request:Request){const admin=await requireAdmin(request);if(!admin)return forbidden();const id=new URL(request.url).searchParams.get("id")||"",db=getDb(),row=(await db.select().from(trustVideos).where(eq(trustVideos.id,id)).limit(1))[0];if(!row)return Response.json({ok:false,error:"NOT_FOUND"},{status:404});if(env.MEDIA)await env.MEDIA.delete(row.objectKey);await db.delete(trustVideos).where(eq(trustVideos.id,id));await writeAudit(db,admin,"trust_video.delete","trust_video",id,"ویدیوی رضایت مشتری حذف شد.",{});return Response.json({ok:true})}
