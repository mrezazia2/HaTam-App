import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { integrationSettings } from "../../../../db/schema";
import { forbidden, requireAdmin } from "../../_lib/authorization";
import { encryptSecret } from "../../_lib/secrets";
import { writeAudit } from "../../_lib/audit";

export const dynamic="force-dynamic";
type Category="sms"|"payment_gateway"|"card_transfer"|"ai";
const categories:Category[]=["sms","payment_gateway","card_transfer","ai"];

export async function GET(request:Request){
  if(!await requireAdmin(request))return forbidden();
  const rows=await getDb().select().from(integrationSettings);
  return Response.json({ok:true,items:rows.map(row=>({category:row.category,provider:row.provider,enabled:row.enabled,publicConfig:row.publicConfig,secretHint:row.secretHint||"ثبت نشده"}))});
}

export async function POST(request:Request){
  const admin=await requireAdmin(request);if(!admin)return forbidden();
  const body=await request.json() as {category:Category;provider:string;enabled:boolean;publicConfig:Record<string,string|boolean>;secret?:string;secretAction?:"keep"|"replace"|"remove"};
  if(!categories.includes(body.category))return Response.json({ok:false,error:"INVALID_CATEGORY"},{status:400});
  if(!body.publicConfig||typeof body.publicConfig!=="object"||String(body.provider||"").length>100)return Response.json({ok:false,error:"INVALID_CONFIG"},{status:400});
  const publicConfig=Object.fromEntries(Object.entries(body.publicConfig).filter(([key,value])=>/^[a-zA-Z][a-zA-Z0-9]{0,63}$/.test(key)&&(typeof value==="string"||typeof value==="boolean")).map(([key,value])=>[key,typeof value==="string"?value.trim().slice(0,8000):value])) as Record<string,string>;
  const db=getDb(),current=(await db.select().from(integrationSettings).where(eq(integrationSettings.category,body.category)).limit(1))[0],timestamp=new Date();
  const providerChanged=body.category==="ai"&&Boolean(current)&&current.provider!==body.provider;
  const remove=body.secretAction==="remove",replace=Boolean(body.secret),encrypted=remove?null:replace?await encryptSecret(body.secret!.slice(0,8000)):providerChanged?null:current?.encryptedSecret||null;
  const hint=remove?null:replace?`••••${body.secret!.slice(-4)}`:providerChanged?null:current?.secretHint||null;
  await db.insert(integrationSettings).values({id:current?.id||`INT-${crypto.randomUUID()}`,category:body.category,provider:body.provider||"",enabled:body.enabled,publicConfig,encryptedSecret:encrypted,secretHint:hint,createdAt:current?.createdAt||timestamp,updatedAt:timestamp}).onConflictDoUpdate({target:integrationSettings.category,set:{provider:body.provider||"",enabled:body.enabled,publicConfig,encryptedSecret:encrypted,secretHint:hint,updatedAt:timestamp}});
  await writeAudit(db,admin,"integration.update","integration",body.category,`تنظیمات ${body.category} به‌روزرسانی شد.`,{provider:body.provider,enabled:body.enabled,secretAction:remove?"removed":replace?"replaced":"kept"});
  return Response.json({ok:true,secretHint:hint||"ثبت نشده"});
}
