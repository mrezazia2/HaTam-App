import {env} from "cloudflare:workers";
import {getDb} from "../../../db";
import {brandSettings} from "../../../db/schema";
import {eq} from "drizzle-orm";
import {forbidden,requireAdmin} from "../_lib/authorization";
import {writeAudit} from "../_lib/audit";

export const dynamic="force-dynamic";
const types:Record<string,string>={png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",ico:"image/x-icon"};

export async function POST(request:Request){
  const admin=await requireAdmin(request);if(!admin)return forbidden();
  if(!env.MEDIA)return Response.json({ok:false,error:"MEDIA_STORAGE_UNAVAILABLE"},{status:503});
  let form:FormData;try{form=await request.formData()}catch{return Response.json({ok:false,error:"INVALID_MULTIPART"},{status:400})}
  const file=form.get("file"),kind=form.get("kind");
  if(!(file instanceof File)||(kind!=="logo"&&kind!=="favicon"))return Response.json({ok:false,error:"INVALID_ASSET"},{status:400});
  const extension=file.name.split(".").pop()?.toLowerCase()||"",contentType=types[extension];
  if(!contentType||file.size<1||file.size>3*1024*1024||file.type&&file.type!==contentType&&!(extension==="ico"&&file.type==="image/vnd.microsoft.icon"))return Response.json({ok:false,error:"INVALID_IMAGE",maxMb:3},{status:400});
  const header=new Uint8Array(await file.slice(0,12).arrayBuffer());
  const valid=extension==="png"?header.slice(0,8).join(",")==="137,80,78,71,13,10,26,10":extension==="jpg"||extension==="jpeg"?header[0]===255&&header[1]===216&&header[2]===255:extension==="webp"?String.fromCharCode(...header.slice(0,4))==="RIFF"&&String.fromCharCode(...header.slice(8,12))==="WEBP":header[0]===0&&header[1]===0&&header[2]===1&&header[3]===0;
  if(!valid)return Response.json({ok:false,error:"INVALID_IMAGE"},{status:400});
  const key=`brand/${kind}-${crypto.randomUUID()}.${extension}`;
  try{await env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType}})}catch(error){console.error("brand asset upload failed",error);return Response.json({ok:false,error:"UPLOAD_STORAGE_FAILED"},{status:503})}
  await writeAudit(getDb(),admin,"brand.asset_upload","brand_asset",key,"تصویر هویت بصری بارگذاری شد.",{kind,size:file.size});
  return Response.json({ok:true,url:`/api/brand-assets?key=${encodeURIComponent(key)}`},{status:201});
}

export async function GET(request:Request){
  const key=new URL(request.url).searchParams.get("key")||"";
  if(!/^brand\/(logo|favicon)-[a-f0-9-]+\.(png|jpg|jpeg|webp|ico)$/.test(key)||!env.MEDIA)return new Response("Not found",{status:404});
  const row=(await getDb().select({logoUrl:brandSettings.logoUrl,faviconUrl:brandSettings.faviconUrl}).from(brandSettings).where(eq(brandSettings.id,"default")).limit(1))[0];
  if(!await requireAdmin(request)&&(!row||![row.logoUrl,row.faviconUrl].some(url=>url.includes(encodeURIComponent(key))||url.includes(key))))return new Response("Not found",{status:404});
  const object=await env.MEDIA.get(key);if(!object)return new Response("Not found",{status:404});
  return new Response(object.body,{headers:{"content-type":object.httpMetadata?.contentType||"image/png","cache-control":"public, max-age=3600","x-content-type-options":"nosniff"}});
}
