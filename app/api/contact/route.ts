import {eq} from "drizzle-orm";
import {getDb} from "../../../db";
import {appConfigurations} from "../../../db/schema";
import {normalizeContactConfig} from "../../contact/config";
export const dynamic="force-dynamic";
export async function GET(){try{const row=(await getDb().select().from(appConfigurations).where(eq(appConfigurations.id,"contact-page")).limit(1))[0];return Response.json({ok:true,config:normalizeContactConfig(row?.value)},{headers:{"cache-control":"no-store"}})}catch{return Response.json({ok:true,config:normalizeContactConfig(null),fallback:true})}}
