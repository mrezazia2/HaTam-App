import { asc,eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { appMenuItems } from "../../../db/schema";
import { defaultAppMenuItems } from "../../mobile/app-menu-config";

export const dynamic="force-dynamic";
export async function GET(){try{const rows=await getDb().select().from(appMenuItems).where(eq(appMenuItems.enabled,true)).orderBy(asc(appMenuItems.sortOrder));return Response.json({ok:true,items:rows.length?rows:defaultAppMenuItems})}catch{return Response.json({ok:true,items:defaultAppMenuItems,fallback:true})}}
