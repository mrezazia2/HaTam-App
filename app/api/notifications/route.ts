import { and,desc,eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { notifications } from "../../../db/schema";
import { getRequestAccount } from "../_lib/authorization";
export const dynamic="force-dynamic";
export async function GET(request:Request){const account=await getRequestAccount(request);if(!account)return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});const items=await getDb().select().from(notifications).where(eq(notifications.accountId,account.id)).orderBy(desc(notifications.createdAt)).limit(50);return Response.json({ok:true,items,unread:items.filter(x=>!x.readAt).length,pollAfter:3000})}
export async function PATCH(request:Request){const account=await getRequestAccount(request);if(!account)return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});const value=await request.json() as {id?:string};if(!value.id)return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400});await getDb().update(notifications).set({readAt:new Date()}).where(and(eq(notifications.id,value.id),eq(notifications.accountId,account.id)));return Response.json({ok:true})}
