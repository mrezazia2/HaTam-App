import {trustedMutation} from "../../../auth/security";
import { and, desc, eq, gt, inArray, isNull, lt, lte, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { accounts, agencies, otpChallenges, sessions, wallets } from "../../../../db/schema";
import { hashValue, isLocalRequest, normalizeMobile, sessionCookie } from "../../_lib/auth";
import {authRateLimited,recordAuthEvent} from "../../_lib/auth-security";
import {writeAudit} from "../../_lib/audit";
import {asciiNumerals} from "../../../auth/digits";
import {loginDestination} from "../../_lib/navigation";

export const dynamic="force-dynamic";
const destinations={user:"/panel",consultant:"/consultant",agency:"/agency"} as const;

export async function POST(request:Request){if(!trustedMutation(request))return Response.json({ok:false,error:"UNTRUSTED_ORIGIN"},{status:403});
 let input:unknown;try{input=await request.json()}catch{return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400})}
 if(!input||typeof input!=="object"||Array.isArray(input))return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400});
 const body=input as {challengeId?:string;mobile?:string;role?:keyof typeof destinations;mode?:"login"|"register";code?:string;surface?:string};
 if(typeof body.mobile!=="string"||body.mobile.length>20||typeof body.challengeId!=="string"||body.challengeId.length>100||typeof body.code!=="string"||!/^\d{4}$/.test(asciiNumerals(body.code))||!Object.hasOwn(destinations,body.role||"")||!["login","register"].includes(body.mode||""))return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400});
 const mobile=normalizeMobile(body.mobile);
 if(!mobile||!body.challengeId||!body.role)return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400});
 const db=getDb(),rate=await authRateLimited(request,mobile,"otp_verify",15*60_000,10,40);if(rate.limited){await writeAudit(db,{id:"anonymous",role:"system"},"auth.otp_verify_limited","auth",null,"آزمون کد یک‌بارمصرف به‌دلیل تلاش زیاد محدود شد.",{identifierHash:rate.identifierHash,ipHash:rate.ipHash});return Response.json({ok:false,error:"OTP_LOCKED"},{status:429})}const challenge=(await db.select().from(otpChallenges).where(and(eq(otpChallenges.id,body.challengeId),eq(otpChallenges.mobile,mobile),eq(otpChallenges.role,body.role),gt(otpChallenges.expiresAt,new Date()),isNull(otpChallenges.consumedAt))).limit(1))[0];
 if(!challenge)return Response.json({ok:false,error:"OTP_EXPIRED"},{status:400});
 if(challenge.attempts>=5)return Response.json({ok:false,error:"OTP_LOCKED"},{status:429});
 const timestamp=new Date();
 const available=()=>and(eq(otpChallenges.id,challenge.id),eq(otpChallenges.mobile,mobile),eq(otpChallenges.role,body.role!),isNull(otpChallenges.consumedAt),gt(otpChallenges.expiresAt,new Date()),lt(otpChallenges.attempts,5));
 if(challenge.codeHash!==await hashValue(`${challenge.id}:${asciiNumerals(body.code)}`)){
  const changed=await db.update(otpChallenges).set({attempts:sql`${otpChallenges.attempts}+1`}).where(available()).returning({attempts:otpChallenges.attempts});
  await recordAuthEvent("otp_verify",rate,false);
  if(!changed.length)return Response.json({ok:false,error:"OTP_EXPIRED_OR_LOCKED"},{status:400});
  return Response.json({ok:false,error:"OTP_INVALID",attemptsLeft:Math.max(0,5-changed[0].attempts)},{status:400});
 }
 // Compare-and-set at the database boundary: only one parallel request can win.
 const consumed=await db.update(otpChallenges).set({consumedAt:timestamp}).where(available()).returning({id:otpChallenges.id});
 if(!consumed.length)return Response.json({ok:false,error:"OTP_EXPIRED_OR_LOCKED"},{status:400});
 await recordAuthEvent("otp_verify",rate,true);
 let account=(await db.select().from(accounts).where(eq(accounts.mobile,mobile)).limit(1))[0];
 if(account&&account.role!==body.role)return Response.json({ok:false,error:"ROLE_MISMATCH"},{status:409});
 if(account&&account.status!=="active"&&account.status!=="pending")return Response.json({ok:false,error:"ACCOUNT_NOT_ACTIVE",status:account.status},{status:403});
 if(!account&&body.mode==="login")return Response.json({ok:false,error:"ACCOUNT_NOT_FOUND"},{status:404});
 if(!account){const accountId=`${body.role==="user"?"U":body.role==="consultant"?"C":"AU"}-${crypto.randomUUID()}`;const status=body.role!=="agency"?"active":"pending";await db.insert(accounts).values({id:accountId,role:body.role,name:`کاربر ${mobile}`,mobile,address:"",status,createdAt:timestamp,updatedAt:timestamp});if(body.role==="agency")await db.insert(agencies).values({id:`A-${crypto.randomUUID()}`,name:`آژانس ${mobile}`,managerAccountId:accountId,phone:mobile,address:"",status:"pending",createdAt:timestamp,updatedAt:timestamp});await db.insert(wallets).values({id:`W-${crypto.randomUUID()}`,accountId,balance:0,currency:"IRT",createdAt:timestamp,updatedAt:timestamp});account=(await db.select().from(accounts).where(eq(accounts.id,accountId)).limit(1))[0]}
 await db.delete(sessions).where(lte(sessions.expiresAt,timestamp));const token=crypto.randomUUID()+crypto.randomUUID();await db.insert(sessions).values({id:`S-${crypto.randomUUID()}`,accountId:account.id,tokenHash:await hashValue(token),expiresAt:new Date(Date.now()+30*24*60*60_000),createdAt:timestamp});const activeSessions=await db.select({id:sessions.id}).from(sessions).where(eq(sessions.accountId,account.id)).orderBy(desc(sessions.createdAt)).limit(20);if(activeSessions.length>5)await db.delete(sessions).where(inArray(sessions.id,activeSessions.slice(5).map(x=>x.id)));await writeAudit(db,account,"auth.otp_signed_in","auth",account.id,"ورود با کد یک‌بارمصرف انجام شد.",{role:account.role});
 return Response.json({ok:true,profileComplete:account.name!==`کاربر ${mobile}`&&account.name.trim().split(/\s+/).length>=2,status:account.status,destination:account.status==="active"?await loginDestination(request,body.role,body.surface):null},{headers:{"set-cookie":sessionCookie(token,!isLocalRequest(request))}});
}
