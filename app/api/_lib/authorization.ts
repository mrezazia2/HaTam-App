import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../../../db";
import { accounts, sessions } from "../../../db/schema";
import { hashValue } from "./auth";
import { presentationMode } from "../../auth/presentation";

export async function requireAdmin(request:Request){
 if(presentationMode())return {id:"local-admin",role:"admin" as const};
 const host=new URL(request.url).hostname;
 if(host==="127.0.0.1"||host==="localhost")return {id:"local-admin",role:"admin" as const};
 const rawCookie=request.headers.get("cookie")||"";const token=rawCookie.split(";").map(x=>x.trim()).find(x=>x.startsWith("hatam_session="))?.split("=")[1];
 if(!token)return null;
 const db=getDb();const tokenHash=await hashValue(decodeURIComponent(token));const rows=await db.select({id:accounts.id,role:accounts.role,status:accounts.status}).from(sessions).innerJoin(accounts,eq(sessions.accountId,accounts.id)).where(and(eq(sessions.tokenHash,tokenHash),gt(sessions.expiresAt,new Date()))).limit(1);
 const account=rows[0];return account?.role==="admin"&&account.status==="active"?{id:account.id,role:"admin" as const}:null;
}

export function forbidden(){return Response.json({ok:false,error:"ADMIN_AUTH_REQUIRED"},{status:403})}

export async function getRequestAccount(request:Request){const host=new URL(request.url).hostname,requested=request.headers.get("x-hatam-preview-role");if(presentationMode()||((host==="127.0.0.1"||host==="localhost")&&requested)){const role=requested==="admin"||requested==="consultant"||requested==="agency"?requested:"user";return{id:`local-${role}`,name:"پیش‌نمایش محلی",mobile:"09120000000",role,status:"active" as const,agencyId:role==="agency"?"local-agency":null}}const rawCookie=request.headers.get("cookie")||"";const token=rawCookie.split(";").map(x=>x.trim()).find(x=>x.startsWith("hatam_session="))?.split("=")[1];if(!token)return null;const rows=await getDb().select({id:accounts.id,name:accounts.name,mobile:accounts.mobile,role:accounts.role,status:accounts.status,agencyId:accounts.agencyId}).from(sessions).innerJoin(accounts,eq(sessions.accountId,accounts.id)).where(and(eq(sessions.tokenHash,await hashValue(decodeURIComponent(token))),gt(sessions.expiresAt,new Date()))).limit(1);return rows[0]||null}
