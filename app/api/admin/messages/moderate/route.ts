import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { messages } from "../../../../../db/schema";
import { requireAdmin } from "../../../_lib/authorization";
import { writeAudit } from "../../../_lib/audit";
export async function PATCH(request:Request){const admin=await requireAdmin(request);if(!admin)return Response.json({ok:false,error:"ADMIN_AUTH_REQUIRED"},{status:403});const value=await request.json() as {messageId?:string;moderationStatus?:"visible"|"flagged"|"hidden"};if(!value.messageId||!value.moderationStatus||!["visible","flagged","hidden"].includes(value.moderationStatus))return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400});const db=getDb();await db.update(messages).set({moderationStatus:value.moderationStatus}).where(eq(messages.id,value.messageId));await writeAudit(db,admin,"message.moderate","message",value.messageId,"وضعیت نظارت پیام تغییر کرد.",{moderationStatus:value.moderationStatus});return Response.json({ok:true})}
