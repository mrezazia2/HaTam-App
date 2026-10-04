import {eq} from "drizzle-orm";
import {getDb} from "../../../../db";
import {accounts} from "../../../../db/schema";
import {getRequestAccount} from "../../_lib/authorization";
import {writeAudit} from "../../_lib/audit";

export const dynamic="force-dynamic";
export async function GET(request:Request){const account=await getRequestAccount(request);if(!account)return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});return Response.json({ok:true,profile:{id:account.id,name:account.name,mobile:account.mobile,address:(await getDb().select({address:accounts.address}).from(accounts).where(eq(accounts.id,account.id)).limit(1))[0]?.address||"",role:account.role,status:account.status}})}
export async function PATCH(request:Request){const account=await getRequestAccount(request);if(!account||account.status!=="active")return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});const value=await request.json() as {name?:string;address?:string};const name=String(value.name||"").trim(),address=String(value.address||"").trim();if(name.length<2||name.length>100||address.length>500)return Response.json({ok:false,error:"INVALID_PROFILE"},{status:400});const db=getDb(),updatedAt=new Date();await db.update(accounts).set({name,address,updatedAt}).where(eq(accounts.id,account.id));await writeAudit(db,account,"account.profile_updated","account",account.id,"اطلاعات پروفایل به‌روزرسانی شد.",{nameChanged:name!==account.name,addressChanged:true});return Response.json({ok:true,profile:{...account,name,address}})}
