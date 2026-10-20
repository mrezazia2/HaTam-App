import {eq} from "drizzle-orm";
import {getDb} from "../../../../db";
import {appConfigurations} from "../../../../db/schema";
import {defaultFilterConfig,type FilterConfig,normalizeFilterConfig} from "../../../mobile/filter-config";
import {forbidden,requireAdmin} from "../../_lib/authorization";
import {writeAudit} from "../../_lib/audit";
export const dynamic="force-dynamic";
export async function GET(request:Request){if(!await requireAdmin(request))return forbidden();const row=(await getDb().select().from(appConfigurations).where(eq(appConfigurations.id,"property-form")).limit(1))[0];return Response.json({ok:true,value:normalizeFilterConfig(row?.value||defaultFilterConfig)})}
export async function POST(request:Request){const admin=await requireAdmin(request);if(!admin)return forbidden();const value=await request.json() as FilterConfig;if(!Array.isArray(value.regions)||!Array.isArray(value.amenities)||!Array.isArray(value.facades))return Response.json({ok:false,error:"INVALID_CONFIG"},{status:400});const db=getDb(),now=new Date(),current=(await db.select().from(appConfigurations).where(eq(appConfigurations.id,"property-form")).limit(1))[0];await db.insert(appConfigurations).values({id:"property-form",value:value as unknown as Record<string,unknown>,createdAt:current?.createdAt||now,updatedAt:now}).onConflictDoUpdate({target:appConfigurations.id,set:{value:value as unknown as Record<string,unknown>,updatedAt:now}});await writeAudit(db,admin,"app_config.update","app_config","property-form","تنظیمات فرم و فیلتر ملک به‌روزرسانی شد.",{regions:value.regions.length,amenities:value.amenities.length});return Response.json({ok:true})}
