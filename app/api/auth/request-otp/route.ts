import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "../../../../db";
import { integrationSettings, otpChallenges } from "../../../../db/schema";
import { decryptSecret } from "../../_lib/secrets";
import { hashValue, isLocalRequest, normalizeMobile } from "../../_lib/auth";
import {authRateLimited,recordAuthEvent} from "../../_lib/auth-security";
import {writeAudit} from "../../_lib/audit";

export const dynamic="force-dynamic";
const roles=["user","consultant","agency"] as const;

export async function POST(request:Request){
 const body=await request.json() as {mobile?:string;role?:string;mode?:string};const mobile=normalizeMobile(body.mobile||"");
 if(!mobile||!roles.includes(body.role as typeof roles[number])||!["login","register"].includes(body.mode||""))return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400});
 const db=getDb();const now=new Date(),rate=await authRateLimited(request,mobile,"otp_request",10*60_000,3,20);if(rate.limited){await writeAudit(db,{id:"anonymous",role:"system"},"auth.otp_rate_limited","auth",null,"درخواست کد یک‌بارمصرف محدود شد.",{identifierHash:rate.identifierHash,ipHash:rate.ipHash});return Response.json({ok:false,error:"RATE_LIMITED",retryAfter:600},{status:429})}const recent=(await db.select().from(otpChallenges).where(and(eq(otpChallenges.mobile,mobile),gt(otpChallenges.createdAt,new Date(Date.now()-60_000)),isNull(otpChallenges.consumedAt))).orderBy(desc(otpChallenges.createdAt)).limit(1))[0];
 if(recent)return Response.json({ok:false,error:"RATE_LIMITED",retryAfter:60},{status:429});await recordAuthEvent("otp_request",rate,true);
 const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%10_000).padStart(4,"0");const id=`OTP-${crypto.randomUUID()}`;
 await db.insert(otpChallenges).values({id,mobile,role:body.role!,codeHash:await hashValue(`${id}:${code}`),attempts:0,expiresAt:new Date(Date.now()+2*60_000),consumedAt:null,createdAt:now});
 const sms=(await db.select().from(integrationSettings).where(eq(integrationSettings.category,"sms")).limit(1))[0];
 if(sms?.enabled&&sms.encryptedSecret&&sms.publicConfig.baseUrl){try{const config=sms.publicConfig,token=await decryptSecret(sms.encryptedSecret),headers:Record<string,string>={"content-type":config.contentType||"application/json"},authHeader=config.authHeader||"Authorization";headers[authHeader]=`${config.authPrefix??"Bearer "}${token}`;const payload:Record<string,string>={token:code};payload[config.receptorField||"receptor"]=mobile;payload[config.senderField||"sender"]=config.sender||"";payload[config.templateField||"template"]=config.otpPattern||"hatam-otp";const response=await fetch(config.baseUrl,{method:config.apiMethod==="PUT"?"PUT":"POST",headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(Math.min(60_000,Math.max(1_000,Number(config.timeoutMs)||15_000)))});if(!response.ok)throw new Error("SMS_PROVIDER_ERROR");await writeAudit(db,{id:"system",role:"system"},"auth.otp_sms_sent","sms",id,"پیامک کد یک‌بارمصرف ارسال شد.",{provider:sms.provider,identifierHash:rate.identifierHash})}catch{await db.delete(otpChallenges).where(eq(otpChallenges.id,id));await writeAudit(db,{id:"system",role:"system"},"auth.otp_sms_failed","sms",id,"ارسال پیامک کد یک‌بارمصرف ناموفق بود.",{provider:sms.provider,identifierHash:rate.identifierHash});return Response.json({ok:false,error:"SMS_SEND_FAILED"},{status:502})}}
 else if(!isLocalRequest(request)){await db.delete(otpChallenges).where(eq(otpChallenges.id,id));return Response.json({ok:false,error:"SMS_NOT_CONFIGURED"},{status:503})}
 return Response.json({ok:true,challengeId:id,expiresIn:120,...(isLocalRequest(request)?{developmentCode:code}:{})});
}
