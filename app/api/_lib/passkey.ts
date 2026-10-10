import {desc,eq,inArray,lte} from "drizzle-orm";
import {getDb} from "../../../db";
import {accounts,passkeyChallenges,sessions} from "../../../db/schema";
import {getRequestAccount} from "./authorization";
import {hashValue,isLocalRequest,sessionCookie} from "./auth";

const productionHosts=new Set(["hatamestate.com","web.hatamestate.com","app.hatamestate.com","panel.hatamestate.com","consultant.hatamestate.com","agency.hatamestate.com"]);
export const passkeyRoles=["user","consultant","agency"] as const;
export type PasskeyRole=typeof passkeyRoles[number];
export const passkeyDestinations:Record<PasskeyRole,string>={user:"/panel",consultant:"/consultant",agency:"/agency"};

export function passkeySite(request:Request){
 const url=new URL(request.url);
 if(url.protocol==="https:"&&productionHosts.has(url.hostname))return{rpID:"hatamestate.com",origin:url.origin};
 if(process.env.NODE_ENV!=="production"&&url.protocol==="http:"&&(url.hostname==="localhost"||url.hostname==="127.0.0.1"))return{rpID:url.hostname,origin:url.origin};
 return null;
}

export function trustedPasskeyMutation(request:Request,site:{origin:string}|null){
 if(!site||request.headers.get("sec-fetch-site")==="cross-site")return false;
 const origin=request.headers.get("origin");
 return !origin||origin===site.origin;
}

export function encodeBytes(bytes:Uint8Array){let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}
export function decodeBytes(value:string){if(!/^[A-Za-z0-9_-]{1,4096}$/.test(value))throw new Error("INVALID_PASSKEY_KEY");const binary=atob(value.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(value.length/4)*4,"="));return Uint8Array.from(binary,char=>char.charCodeAt(0))}
export async function userHandle(accountId:string){return new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(`hatam-passkey:${accountId}`)))}

export async function authenticatedPasskeyAccount(request:Request){
 const session=await getRequestAccount(request,{allowPending:true});
 if(!session||!passkeyRoles.includes(session.role as PasskeyRole))return null;
 const rows=await getDb().select().from(accounts).where(eq(accounts.id,session.id)).limit(1);
 const account=rows[0];return account&&account.role===session.role&&["active","pending"].includes(account.status)?account:null;
}

export async function createPasskeyChallenge(accountId:string,kind:"register"|"authenticate",challenge:string,origin:string){
 const db=getDb(),now=new Date(),id=`PKC-${crypto.randomUUID()}`;await db.delete(passkeyChallenges).where(lte(passkeyChallenges.expiresAt,now));
 await db.insert(passkeyChallenges).values({id,accountId,kind,challenge,origin,expiresAt:new Date(Date.now()+5*60_000),createdAt:now});
 return id;
}

export async function issuePasskeySession(request:Request,accountId:string){
 const db=getDb(),now=new Date(),token=crypto.randomUUID()+crypto.randomUUID();
 await db.delete(sessions).where(lte(sessions.expiresAt,now));
 await db.insert(sessions).values({id:`S-${crypto.randomUUID()}`,accountId,tokenHash:await hashValue(token),expiresAt:new Date(Date.now()+30*24*60*60_000),createdAt:now});
 const active=await db.select({id:sessions.id}).from(sessions).where(eq(sessions.accountId,accountId)).orderBy(desc(sessions.createdAt)).limit(20);
 if(active.length>5)await db.delete(sessions).where(inArray(sessions.id,active.slice(5).map(x=>x.id)));
 return sessionCookie(token,!isLocalRequest(request));
}
