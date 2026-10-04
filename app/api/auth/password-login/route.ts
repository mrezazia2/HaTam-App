import {trustedMutation} from "../../../auth/security";
import {desc,eq,inArray,lte} from "drizzle-orm";
import {getDb} from "../../../../db";
import {accounts,sessions} from "../../../../db/schema";
import {hashValue,isLocalRequest,normalizeMobile,sessionCookie,verifyPassword} from "../../_lib/auth";
import {authRateLimited,recordAuthEvent} from "../../_lib/auth-security";
import {writeAudit} from "../../_lib/audit";

const destinations={user:"/panel",consultant:"/consultant",agency:"/agency",admin:"/admin"} as const;
export async function POST(request:Request){if(!trustedMutation(request))return Response.json({ok:false,error:"UNTRUSTED_ORIGIN"},{status:403});
 let body:{username?:string;password?:string;role?:keyof typeof destinations};try{body=await request.json()}catch{return Response.json({ok:false,error:"INVALID_CREDENTIALS"},{status:400})}const mobile=normalizeMobile(String(body?.username||"")),password=String(body?.password||"");if(!mobile||!password||!body?.role||!destinations[body.role])return Response.json({ok:false,error:"INVALID_CREDENTIALS"},{status:400});
 const db=getDb(),rate=await authRateLimited(request,mobile,"password_login",15*60_000,6,40);if(rate.limited){await writeAudit(db,{id:"anonymous",role:"system"},"auth.password_rate_limited","auth",null,"ورود با رمز به‌دلیل تلاش زیاد محدود شد.",{identifierHash:rate.identifierHash,ipHash:rate.ipHash});return Response.json({ok:false,error:"TOO_MANY_ATTEMPTS",retryAfter:900},{status:429})}
 const account=(await db.select().from(accounts).where(eq(accounts.mobile,mobile)).limit(1))[0],valid=Boolean(account&&account.role===body.role&&account.passwordHash&&await verifyPassword(password,account.passwordHash));await recordAuthEvent("password_login",rate,valid);
 if(!valid){await writeAudit(db,{id:account?.id||"anonymous",role:account?.role||"system"},"auth.password_failed","auth",account?.id||null,"تلاش ناموفق ورود با رمز ثبت شد.",{identifierHash:rate.identifierHash,ipHash:rate.ipHash});return Response.json({ok:false,error:"INVALID_CREDENTIALS"},{status:401})}
 if(account!.status!=="active")return Response.json({ok:false,error:"ACCOUNT_NOT_ACTIVE",status:account!.status},{status:403});const now=new Date();await db.delete(sessions).where(lte(sessions.expiresAt,now));const token=crypto.randomUUID()+crypto.randomUUID();await db.insert(sessions).values({id:`S-${crypto.randomUUID()}`,accountId:account!.id,tokenHash:await hashValue(token),expiresAt:new Date(Date.now()+30*24*60*60_000),createdAt:now});const active=await db.select({id:sessions.id}).from(sessions).where(eq(sessions.accountId,account!.id)).orderBy(desc(sessions.createdAt)).limit(20);if(active.length>5)await db.delete(sessions).where(inArray(sessions.id,active.slice(5).map(x=>x.id)));await writeAudit(db,account!,"auth.password_signed_in","auth",account!.id,"ورود با نام کاربری و رمز انجام شد.",{role:account!.role});return Response.json({ok:true,destination:destinations[account!.role]},{headers:{"set-cookie":sessionCookie(token,!isLocalRequest(request))}});
}
