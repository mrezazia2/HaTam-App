import { and,count,desc,eq,isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { notifications } from "../../../db/schema";
import { getRequestAccount } from "../_lib/authorization";
export const dynamic="force-dynamic";
export async function GET(request:Request){const account=await getRequestAccount(request);if(!account)return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});const items=await getDb().select().from(notifications).where(eq(notifications.accountId,account.id)).orderBy(desc(notifications.createdAt)).limit(50);const [total]=await getDb().select({value:count()}).from(notifications).where(and(eq(notifications.accountId,account.id),isNull(notifications.readAt)));return Response.json({ok:true,items,unread:total.value,pollAfter:3000})}
export async function PATCH(request:Request){const account=await getRequestAccount(request);if(!account)return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});const value=await request.json() as {id?:string;all?:boolean};if(!value.id&&value.all!==true)return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400});await getDb().update(notifications).set({readAt:new Date()}).where(and(eq(notifications.accountId,account.id),value.all===true?isNull(notifications.readAt):eq(notifications.id,value.id!)));return Response.json({ok:true})}
