import {eq} from "drizzle-orm";
import {getDb} from "../../../../db";
import {accounts,agencies} from "../../../../db/schema";
import {getRequestAccount} from "../../_lib/authorization";
import {writeAudit} from "../../_lib/audit";

function splitName(value:string){
  const parts=value.trim().split(/\s+/).filter(Boolean);
  return {firstName:parts.shift()||"",lastName:parts.join(" ")};
}

function isPlaceholder(name:string,mobile:string){
  const normalized=name.trim();
  return !normalized||normalized===`کاربر ${mobile}`||normalized===`مشاور ${mobile}`||normalized===`آژانس ${mobile}`;
}

export async function GET(request:Request){
  const account=await getRequestAccount(request,{allowPending:true});
  if(!account)return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});
  const db=getDb();
  const row=(await db.select({name:accounts.name,mobile:accounts.mobile,passwordHash:accounts.passwordHash,role:accounts.role}).from(accounts).where(eq(accounts.id,account.id)).limit(1))[0];
  if(!row)return Response.json({ok:false,error:"ACCOUNT_NOT_FOUND"},{status:404});
  const agency=row.role==="agency"?(await db.select({name:agencies.name}).from(agencies).where(eq(agencies.managerAccountId,account.id)).limit(1))[0]:null;
  const placeholder=isPlaceholder(row.name,row.mobile);
  const parsed=placeholder?{firstName:"",lastName:""}:splitName(row.name);
  const agencyName=agency?.name&&!agency.name.includes(row.mobile)?agency.name:"";
  return Response.json({ok:true,role:row.role,username:row.mobile,firstName:parsed.firstName,lastName:parsed.lastName,agencyName,profileComplete:!placeholder&&!!parsed.firstName&&!!parsed.lastName&&(row.role!=="agency"||!!agencyName),passwordComplete:!!row.passwordHash});
}

export async function PATCH(request:Request){
  const account=await getRequestAccount(request,{allowPending:true});
  if(!account)return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});
  const body=await request.json() as {firstName?:string;lastName?:string;agencyName?:string};
  const firstName=String(body.firstName||"").trim().replace(/\s+/g," ");
  const lastName=String(body.lastName||"").trim().replace(/\s+/g," ");
  const agencyName=String(body.agencyName||"").trim().replace(/\s+/g," ");
  if(firstName.length<2||firstName.length>50||lastName.length<2||lastName.length>70||(account.role==="agency"&&(agencyName.length<2||agencyName.length>120)))return Response.json({ok:false,error:"INVALID_PROFILE"},{status:400});
  const db=getDb(),now=new Date(),name=`${firstName} ${lastName}`;
  await db.update(accounts).set({name,updatedAt:now}).where(eq(accounts.id,account.id));
  if(account.role==="agency")await db.update(agencies).set({name:agencyName,updatedAt:now}).where(eq(agencies.managerAccountId,account.id));
  await writeAudit(db,account,"auth.onboarding_profile_completed","account",account.id,"اطلاعات اولیه حساب پس از ورود با کد یک‌بارمصرف تکمیل شد.",{role:account.role,agencyNameChanged:account.role==="agency"});
  return Response.json({ok:true,name,agencyName:account.role==="agency"?agencyName:null});
}
