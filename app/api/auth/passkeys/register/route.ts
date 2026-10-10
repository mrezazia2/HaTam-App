import {generateRegistrationOptions,verifyRegistrationResponse} from "@simplewebauthn/server";
import {and,eq,gt,isNull} from "drizzle-orm";
import {getDb} from "../../../../../db";
import {passkeyChallenges,passkeyCredentials} from "../../../../../db/schema";
import {writeAudit} from "../../../_lib/audit";
import {authenticatedPasskeyAccount,createPasskeyChallenge,encodeBytes,passkeySite,trustedPasskeyMutation,userHandle} from "../../../_lib/passkey";

export const dynamic="force-dynamic";
type RegistrationResponse=Parameters<typeof verifyRegistrationResponse>[0]["response"];

export async function POST(request:Request){
 const site=passkeySite(request);if(!trustedPasskeyMutation(request,site))return Response.json({ok:false,error:"UNTRUSTED_ORIGIN"},{status:403});
 if(Number(request.headers.get("content-length")||0)>65536)return Response.json({ok:false,error:"INVALID_REQUEST"},{status:413});
 const account=await authenticatedPasskeyAccount(request);
 if(!site||!account)return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});
 let body:{action?:string;challengeId?:string;response?:RegistrationResponse;label?:string;name?:string;code?:string};
 try{body=await request.json()}catch{return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400})}
 const db=getDb();
 if(body.action==="begin"){
  const existing=await db.select().from(passkeyCredentials).where(eq(passkeyCredentials.accountId,account.id));
  if(existing.length>=5)return Response.json({ok:false,error:"PASSKEY_LIMIT"},{status:409});
  const options=await generateRegistrationOptions({rpID:site.rpID,rpName:"املاک حاتم",userName:account.mobile,userDisplayName:account.name?.trim()||account.mobile,userID:await userHandle(account.id),attestationType:"none",timeout:120000,preferredAuthenticatorType:"localDevice",authenticatorSelection:{residentKey:"required",userVerification:"required"},excludeCredentials:existing.map(item=>({id:item.credentialId,transports:item.transports as any}))});
  const challengeId=await createPasskeyChallenge(account.id,"register",options.challenge,site.origin);
  return Response.json({ok:true,challengeId,options});
 }
 if(body.action==="client-error"){
  if(typeof body.challengeId!=="string"||body.challengeId.length>100)return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400});
  const knownNames=new Set(["NotAllowedError","InvalidStateError","SecurityError","NotSupportedError","UnknownError","AbortError","ConstraintError","TypeError"]);
  const knownCodes=new Set(["ERROR_CEREMONY_ABORTED","ERROR_INVALID_DOMAIN","ERROR_INVALID_RP_ID","ERROR_INVALID_USER_ID_LENGTH","ERROR_MALFORMED_PUBKEYCREDPARAMS","ERROR_AUTHENTICATOR_GENERAL_ERROR","ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT","ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT","ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED","ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG","ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY"]);
  const used=await db.update(passkeyChallenges).set({consumedAt:new Date()}).where(and(eq(passkeyChallenges.id,body.challengeId),eq(passkeyChallenges.accountId,account.id),eq(passkeyChallenges.kind,"register"),eq(passkeyChallenges.origin,site.origin),gt(passkeyChallenges.expiresAt,new Date()),isNull(passkeyChallenges.consumedAt))).returning({id:passkeyChallenges.id});
  if(!used.length)return Response.json({ok:false,error:"PASSKEY_CHALLENGE_EXPIRED"},{status:400});
  await writeAudit(db,account,"auth.passkey_client_failed","auth",account.id,"مرورگر یا قفل دستگاه ساخت کلید عبور را تکمیل نکرد.",{name:knownNames.has(body.name||"")?body.name:"Other",code:knownCodes.has(body.code||"")?body.code:"Other"});
  return Response.json({ok:true});
 }
 if(body.action!=="finish"||typeof body.challengeId!=="string"||body.challengeId.length>100||!body.response||typeof body.response.id!=="string")return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400});
 const challenge=(await db.select().from(passkeyChallenges).where(and(eq(passkeyChallenges.id,body.challengeId),eq(passkeyChallenges.accountId,account.id),eq(passkeyChallenges.kind,"register"),eq(passkeyChallenges.origin,site.origin),gt(passkeyChallenges.expiresAt,new Date()),isNull(passkeyChallenges.consumedAt))).limit(1))[0];
 if(!challenge)return Response.json({ok:false,error:"PASSKEY_CHALLENGE_EXPIRED"},{status:400});
 let verified:Awaited<ReturnType<typeof verifyRegistrationResponse>>;
 try{verified=await verifyRegistrationResponse({response:body.response,expectedChallenge:challenge.challenge,expectedOrigin:challenge.origin,expectedRPID:site.rpID,requireUserVerification:true})}catch{return Response.json({ok:false,error:"PASSKEY_VERIFICATION_FAILED"},{status:400})}
 if(!verified.verified||!verified.registrationInfo)return Response.json({ok:false,error:"PASSKEY_VERIFICATION_FAILED"},{status:400});
 const used=await db.update(passkeyChallenges).set({consumedAt:new Date()}).where(and(eq(passkeyChallenges.id,challenge.id),isNull(passkeyChallenges.consumedAt),gt(passkeyChallenges.expiresAt,new Date()))).returning({id:passkeyChallenges.id});
 if(!used.length)return Response.json({ok:false,error:"PASSKEY_CHALLENGE_EXPIRED"},{status:400});
 const info=verified.registrationInfo,credential=info.credential,label=String(body.label||"قفل دستگاه").trim().slice(0,50)||"قفل دستگاه";
 try{await db.insert(passkeyCredentials).values({credentialId:credential.id,accountId:account.id,publicKey:encodeBytes(credential.publicKey),counter:credential.counter,transports:credential.transports||[],deviceType:info.credentialDeviceType,backedUp:info.credentialBackedUp,label,createdAt:new Date()})}catch{return Response.json({ok:false,error:"PASSKEY_ALREADY_REGISTERED"},{status:409})}
 await writeAudit(db,account,"auth.passkey_registered","auth",account.id,"کلید عبور دستگاه فعال شد.",{role:account.role});
 return Response.json({ok:true,label});
}
