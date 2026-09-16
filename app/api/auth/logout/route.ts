import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { sessions } from "../../../../db/schema";
import { hashValue } from "../../_lib/auth";
import {getRequestAccount} from "../../_lib/authorization";
import {writeAudit} from "../../_lib/audit";
export async function POST(request:Request){const account=await getRequestAccount(request),cookie=request.headers.get("cookie")||"",encoded=cookie.split(";").map(item=>item.trim()).find(item=>item.startsWith("hatam_session="))?.slice("hatam_session=".length),db=getDb();if(encoded)await db.delete(sessions).where(eq(sessions.tokenHash,await hashValue(decodeURIComponent(encoded))));if(account)await writeAudit(db,account,"auth.signed_out","auth",account.id,"خروج از حساب انجام شد.",{});return Response.json({ok:true},{headers:{"set-cookie":"hatam_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"}})}
