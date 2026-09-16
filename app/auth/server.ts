import { presentationMode } from "./presentation";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../../db";
import { accounts, sessions } from "../../db/schema";
import { hashValue } from "../api/_lib/auth";

export type AccountRole="admin"|"user"|"consultant"|"agency";
export async function currentAccount(localRole?:AccountRole){const incoming=await headers();const host=(incoming.get("host")||"").split(":")[0];if((presentationMode()||host==="localhost"||host==="127.0.0.1")&&localRole)return{id:"local-preview",name:"پیش‌نمایش محلی",mobile:"",role:localRole,status:"active" as const};const cookie=incoming.get("cookie")||"";const encoded=cookie.split(";").map(item=>item.trim()).find(item=>item.startsWith("hatam_session="))?.slice("hatam_session=".length);if(!encoded)return null;const rows=await getDb().select({id:accounts.id,name:accounts.name,mobile:accounts.mobile,role:accounts.role,status:accounts.status}).from(sessions).innerJoin(accounts,eq(sessions.accountId,accounts.id)).where(and(eq(sessions.tokenHash,await hashValue(decodeURIComponent(encoded))),gt(sessions.expiresAt,new Date()))).limit(1);return rows[0]||null}
export async function requireRole(role:AccountRole,returnTo:string){const account=await currentAccount(role);if(!account||account.role!==role||account.status!=="active")redirect(`/login/${role}?returnTo=${encodeURIComponent(returnTo)}`);return account}
