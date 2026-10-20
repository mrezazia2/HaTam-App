import {eq} from "drizzle-orm";
import {getDb} from "../../../db";
import {appConfigurations} from "../../../db/schema";
import {defaultFilterConfig,normalizeFilterConfig} from "../../mobile/filter-config";
export const dynamic="force-dynamic";
export async function GET(request:Request){const key=new URL(request.url).searchParams.get("key")||"";if(key!=="property-form")return Response.json({ok:false,error:"INVALID_KEY"},{status:400});try{const row=(await getDb().select().from(appConfigurations).where(eq(appConfigurations.id,key)).limit(1))[0];return Response.json({ok:true,value:normalizeFilterConfig(row?.value||defaultFilterConfig)})}catch{return Response.json({ok:true,value:defaultFilterConfig,fallback:true})}}
