import {eq} from "drizzle-orm";
import {getDb} from "../../../db";
import {appConfigurations,cooperateApplications,auditLogs} from "../../../db/schema";
import {normalizeCooperateConfig} from "../../cooperate/config";
import {normalizeMobile} from "../_lib/auth";
export const dynamic="force-dynamic";
export async function GET(){try{const row=(await getDb().select().from(appConfigurations).where(eq(appConfigurations.id,"cooperate-page")).limit(1))[0];return Response.json({ok:true,config:normalizeCooperateConfig(row?.value)},{headers:{"cache-control":"no-store"}})}catch{return Response.json({ok:true,config:normalizeCooperateConfig(null),fallback:true})}}
export async function POST(request:Request){
 if(Number(request.headers.get("content-length")||0)>16384)return Response.json({ok:false,error:"INVALID_REQUEST"},{status:413});
 let value:Record<string,unknown>;try{value=await request.json()}catch{return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400})}
 const config=normalizeCooperateConfig((await getDb().select().from(appConfigurations).where(eq(appConfigurations.id,"cooperate-page")).limit(1))[0]?.value),mobile=normalizeMobile(String(value.mobile||""))||"";
 if(!/^09\d{9}$/.test(mobile))return Response.json({ok:false,message:"شماره موبایل معتبر الزامی است."},{status:400});
 const hasExperience=value.hasExperience===true;
 for(const field of config.fields.filter(field=>field.enabled&&field.required)){
  const basic=["firstName","lastName","age","mobile"].includes(field.id)||field.group==="basic";
  if((basic||hasExperience)&&!String(value[field.id]||"").trim())return Response.json({ok:false,message:`${field.label} الزامی است.`},{status:400});
 }
 const allowed=Object.fromEntries(config.fields.filter(field=>field.enabled).map(field=>[field.id,String(value[field.id]||"").trim().slice(0,300)]));
 const db=getDb(),now=new Date(),application={...allowed,id:`CO-${crypto.randomUUID()}`,mobile,hasExperience,status:"new",createdAt:now.toISOString()};
 await db.batch([db.insert(cooperateApplications).values({id:application.id,payload:application,createdAt:now}),db.insert(auditLogs).values({id:`AUD-${crypto.randomUUID()}`,actorAccountId:"anonymous",actorRole:"guest",action:"cooperate_application.created",entityType:"cooperate_application",entityId:application.id,summary:"درخواست همکاری ثبت شد.",metadata:{},createdAt:now})]);
 return Response.json({ok:true,id:application.id});
}
