import {sessionToken, trustedMutation} from "../../auth/security";
import {localPreviewHost} from "../../auth/local-preview";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../../../db";
import { accounts, sessions } from "../../../db/schema";
import { hashValue } from "./auth";
import { presentationMode } from "../../auth/presentation";

export async function requireAdmin(request:Request){
 if(!trustedMutation(request))return null;
 if(presentationMode())return {id:"local-admin",role:"admin" as const};
 const host=new URL(request.url).hostname;
 if(localPreviewHost(host))return {id:"local-admin",role:"admin" as const};
 const token=sessionToken(request.headers.get("cookie")||"");
 if(!token)return null;
 const db=getDb();const tokenHash=await hashValue(token);const rows=await db.select({id:accounts.id,role:accounts.role,status:accounts.status}).from(sessions).innerJoin(accounts,eq(sessions.accountId,accounts.id)).where(and(eq(sessions.tokenHash,tokenHash),gt(sessions.expiresAt,new Date()))).limit(1);
 const account=rows[0];return account?.role==="admin"&&account.status==="active"?{id:account.id,role:"admin" as const}:null;
}

export function forbidden(){return Response.json({ok:false,error:"ADMIN_AUTH_REQUIRED"},{status:403})}

export async function getRequestAccount(request:Request, options:{allowPending?:boolean}={}){if(!trustedMutation(request))return null;const host=new URL(request.url).hostname,requested=request.headers.get("x-hatam-preview-role");if(presentationMode()||((localPreviewHost(host))&&requested)){const role=requested==="admin"||requested==="consultant"||requested==="agency"?requested:"user";return{id:`local-${role}`,name:"پیش‌نمایش محلی",mobile:"09120000000",role,status:"active" as const,agencyId:role==="agency"?"local-agency":null}}const token=sessionToken(request.headers.get("cookie")||"");if(!token)return null;const rows=await getDb().select({id:accounts.id,name:accounts.name,mobile:accounts.mobile,role:accounts.role,status:accounts.status,agencyId:accounts.agencyId}).from(sessions).innerJoin(accounts,eq(sessions.accountId,accounts.id)).where(and(eq(sessions.tokenHash,await hashValue(token)),gt(sessions.expiresAt,new Date()))).limit(1);const account=rows[0];return account&&(account.status==="active"||(options.allowPending&&account.status==="pending"))?account:null}
