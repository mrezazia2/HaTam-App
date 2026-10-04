import {canManageProperty} from "../../../_lib/property-access";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { properties, propertyStatusHistory } from "../../../../../db/schema";
import { getRequestAccount } from "../../../_lib/authorization";

export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){const account=await getRequestAccount(request);if(!account)return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});const {id}=await params;const db=getDb();const property=(await db.select().from(properties).where(eq(properties.id,id)).limit(1))[0];if(!property)return Response.json({ok:false,error:"NOT_FOUND"},{status:404});const owns=canManageProperty(account,property);if(!owns)return Response.json({ok:false,error:"FORBIDDEN"},{status:403});const items=await db.select().from(propertyStatusHistory).where(eq(propertyStatusHistory.propertyId,id)).orderBy(asc(propertyStatusHistory.createdAt));return Response.json({ok:true,items})}
