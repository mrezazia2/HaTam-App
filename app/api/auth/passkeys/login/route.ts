import {generateAuthenticationOptions,verifyAuthenticationResponse} from "@simplewebauthn/server";
import {and,eq,gt,isNull} from "drizzle-orm";
import {getDb} from "../../../../../db";
import {accounts,passkeyChallenges,passkeyCredentials} from "../../../../../db/schema";
import {normalizeMobile} from "../../../_lib/auth";
import {authRateLimited,recordAuthEvent} from "../../../_lib/auth-security";
import {writeAudit} from "../../../_lib/audit";
import {createPasskeyChallenge,decodeBytes,issuePasskeySession,passkeyDestinations,passkeyRoles,passkeySite,trustedPasskeyMutation,type PasskeyRole} from "../../../_lib/passkey";
import {loginDestination} from "../../../_lib/navigation";

export const dynamic="force-dynamic";
type AuthenticationResponse=Parameters<typeof verifyAuthenticationResponse>[0]["response"];

export async function POST(request:Request){
 const site=passkeySite(request);if(!site)return Response.json({ok:false,error:"PASSKEY_ORIGIN_UNAVAILABLE"},{status:403});
 if(!trustedPasskeyMutation(request,site))return Response.json({ok:false,error:"UNTRUSTED_ORIGIN"},{status:403});
 if(Number(request.headers.get("content-length")||0)>65536)return Response.json({ok:false,error:"INVALID_REQUEST"},{status:413});
 let body:{action?:string;mobile?:string;role?:PasskeyRole;challengeId?:string;response?:AuthenticationResponse};
 try{body=await request.json()}catch{return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400})}
 const db=getDb();
 if(body.action==="begin"){
  const mobile=normalizeMobile(String(body.mobile||""));
  if(!mobile||!passkeyRoles.includes(body.role as PasskeyRole))return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400});
  const rate=await authRateLimited(request,mobile,"passkey_login",15*60_000,20,60);
  if(rate.limited)return Response.json({ok:false,error:"TOO_MANY_ATTEMPTS"},{status:429});
  await recordAuthEvent("passkey_login",rate,false);
  const account=(await db.select().from(accounts).where(eq(accounts.mobile,mobile)).limit(1))[0];
  if(!account||account.role!==body.role||account.status!=="active")return Response.json({ok:false,error:"PASSKEY_NOT_AVAILABLE"},{status:404});
  const credentials=await db.select().from(passkeyCredentials).where(eq(passkeyCredentials.accountId,account.id));
  if(!credentials.length)return Response.json({ok:false,error:"PASSKEY_NOT_AVAILABLE"},{status:404});
  const options=await generateAuthenticationOptions({rpID:site.rpID,userVerification:"required",allowCredentials:credentials.map(item=>({id:item.credentialId,transports:item.transports as any}))});
  const challengeId=await createPasskeyChallenge(account.id,"authenticate",options.challenge,site.origin);
  return Response.json({ok:true,challengeId,options});
 }
 if(body.action!=="finish"||typeof body.challengeId!=="string"||body.challengeId.length>100||!body.response||typeof body.response.id!=="string"||body.response.id.length>1024)return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400});
 const challenge=(await db.select().from(passkeyChallenges).where(and(eq(passkeyChallenges.id,body.challengeId),eq(passkeyChallenges.kind,"authenticate"),eq(passkeyChallenges.origin,site.origin),gt(passkeyChallenges.expiresAt,new Date()),isNull(passkeyChallenges.consumedAt))).limit(1))[0];
 if(!challenge)return Response.json({ok:false,error:"PASSKEY_CHALLENGE_EXPIRED"},{status:400});
 const account=(await db.select().from(accounts).where(eq(accounts.id,challenge.accountId)).limit(1))[0];
 if(!account||account.status!=="active"||!passkeyRoles.includes(account.role as PasskeyRole))return Response.json({ok:false,error:"PASSKEY_NOT_AVAILABLE"},{status:403});
 const credential=(await db.select().from(passkeyCredentials).where(and(eq(passkeyCredentials.credentialId,body.response.id),eq(passkeyCredentials.accountId,account.id))).limit(1))[0];
 if(!credential)return Response.json({ok:false,error:"PASSKEY_VERIFICATION_FAILED"},{status:400});
 let verified:Awaited<ReturnType<typeof verifyAuthenticationResponse>>;
 try{verified=await verifyAuthenticationResponse({response:body.response,expectedChallenge:challenge.challenge,expectedOrigin:challenge.origin,expectedRPID:site.rpID,requireUserVerification:true,credential:{id:credential.credentialId,publicKey:decodeBytes(credential.publicKey),counter:credential.counter,transports:credential.transports as any}})}catch{return Response.json({ok:false,error:"PASSKEY_VERIFICATION_FAILED"},{status:400})}
 if(!verified.verified)return Response.json({ok:false,error:"PASSKEY_VERIFICATION_FAILED"},{status:400});
 const consumed=await db.update(passkeyChallenges).set({consumedAt:new Date()}).where(and(eq(passkeyChallenges.id,challenge.id),isNull(passkeyChallenges.consumedAt),gt(passkeyChallenges.expiresAt,new Date()))).returning({id:passkeyChallenges.id});
 if(!consumed.length)return Response.json({ok:false,error:"PASSKEY_CHALLENGE_EXPIRED"},{status:400});
 await db.update(passkeyCredentials).set({counter:verified.authenticationInfo.newCounter,lastUsedAt:new Date()}).where(eq(passkeyCredentials.credentialId,credential.credentialId));
 const cookie=await issuePasskeySession(request,account.id);
 await writeAudit(db,account,"auth.passkey_signed_in","auth",account.id,"ورود با قفل دستگاه انجام شد.",{role:account.role});
 return Response.json({ok:true,destination:await loginDestination(request,account.role as PasskeyRole)},{headers:{"set-cookie":cookie}});
}
