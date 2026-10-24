import {eq} from "drizzle-orm";
import {getDb} from "../../../db";
import {appConfigurations} from "../../../db/schema";
import {cleanSiteMenu} from "../_lib/site-menu";
export async function GET(){const row=(await getDb().select().from(appConfigurations).where(eq(appConfigurations.id,"site-menu")).limit(1))[0];return Response.json({items:cleanSiteMenu(row?.value.items).filter(x=>x.enabled)},{headers:{"cache-control":"no-store"}})}
