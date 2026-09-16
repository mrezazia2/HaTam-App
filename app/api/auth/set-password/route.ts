import {eq} from "drizzle-orm";
import {getDb} from "../../../../db";
import {accounts,sessions} from "../../../../db/schema";
import {getRequestAccount} from "../../_lib/authorization";
import {hashValue,isLocalRequest,passwordHash,sessionCookie} from "../../_lib/auth";
import {writeAudit} from "../../_lib/audit";

const common=new Set(["password1","12345678a","qwerty123","11111111a"]);
export async function POST(request:Request){const account=await getRequestAccount(request);if(!account)return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});const body=await request.json() as {password?:string},password=String(body.password||"");if(password.length<8||password.length>128||!/[\p{L}]/u.test(password)||!/[0-9]/.test(password)||common.has(password.toLowerCase())||password.includes(account.mobile))return Response.json({ok:false,error:"WEAK_PASSWORD"},{status:400});const db=getDb(),now=new Date();await db.update(accounts).set({passwordHash:await passwordHash(password),updatedAt:now}).where(eq(accounts.id,account.id));await db.delete(sessions).where(eq(sessions.accountId,account.id));const token=crypto.randomUUID()+crypto.randomUUID();await db.insert(sessions).values({id:`S-${crypto.randomUUID()}`,accountId:account.id,tokenHash:await hashValue(token),expiresAt:new Date(Date.now()+30*24*60*60_000),createdAt:now});await writeAudit(db,account,"auth.password_changed","auth",account.id,"رمز عبور تغییر کرد و نشست‌های قبلی باطل شدند.",{});return Response.json({ok:true,username:account.mobile},{headers:{"set-cookie":sessionCookie(token,!isLocalRequest(request))}})}
