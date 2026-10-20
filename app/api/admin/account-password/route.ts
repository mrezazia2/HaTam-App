import {eq} from "drizzle-orm";
import {getDb} from "../../../../db";
import {accounts,agencies,sessions} from "../../../../db/schema";
import {requireAdmin,forbidden} from "../../_lib/authorization";
import {passwordHash} from "../../_lib/auth";
import {writeAudit} from "../../_lib/audit";

export const dynamic="force-dynamic";
const common=new Set(["password123","12345678","123456789","qwerty123"]);

export async function POST(request:Request){
 const admin=await requireAdmin(request);if(!admin)return forbidden();
 if(Number(request.headers.get("content-length")||0)>4096)return Response.json({ok:false,error:"INVALID_REQUEST"},{status:413});
 let body:{resource?:string;id?:string;password?:string};try{body=await request.json()}catch{return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400})}
 const resource=body.resource,id=String(body.id||""),password=String(body.password||"");
 if(!["customers","consultants","agencies"].includes(resource||"")||!id)return Response.json({ok:false,error:"INVALID_TARGET"},{status:400});
 const db=getDb();let accountId=id;
 if(resource==="agencies"){
  const agency=(await db.select({managerAccountId:agencies.managerAccountId}).from(agencies).where(eq(agencies.id,id)).limit(1))[0];
  if(!agency?.managerAccountId)return Response.json({ok:false,error:"AGENCY_MANAGER_NOT_FOUND"},{status:404});
  accountId=agency.managerAccountId;
 }
 const target=(await db.select({id:accounts.id,mobile:accounts.mobile,role:accounts.role}).from(accounts).where(eq(accounts.id,accountId)).limit(1))[0];
 const expectedRole=resource==="customers"?"user":resource==="consultants"?"consultant":"agency";
 if(!target||target.role!==expectedRole)return Response.json({ok:false,error:"ACCOUNT_NOT_FOUND"},{status:404});
 if(password.length<8||password.length>128||!/[\p{L}]/u.test(password)||!/[0-9]/.test(password)||common.has(password.toLowerCase())||password.includes(target.mobile))return Response.json({ok:false,error:"WEAK_PASSWORD"},{status:400});
 await db.update(accounts).set({passwordHash:await passwordHash(password),updatedAt:new Date()}).where(eq(accounts.id,target.id));
 await db.delete(sessions).where(eq(sessions.accountId,target.id));
 await writeAudit(db,admin,"account.password_reset","accounts",target.id,"مدیر رمز عبور حساب را بازنشانی و نشست‌های قبلی را باطل کرد.",{resource});
 return Response.json({ok:true,mobile:target.mobile},{headers:{"cache-control":"no-store"}});
}
