import {eq} from "drizzle-orm";
import {getDb} from "../../../db";
import {appConfigurations} from "../../../db/schema";
import {defaultContactConfig} from "../../contact/config";
export const dynamic="force-dynamic";
export async function GET(){try{const row=(await getDb().select().from(appConfigurations).where(eq(appConfigurations.id,"contact-page")).limit(1))[0];return Response.json({ok:true,config:row?.value||defaultContactConfig})}catch{return Response.json({ok:true,config:defaultContactConfig,fallback:true})}}
