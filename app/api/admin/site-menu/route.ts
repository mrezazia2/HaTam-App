import {eq} from "drizzle-orm";
import {getDb} from "../../../../db";
import {appConfigurations} from "../../../../db/schema";
import {requireAdmin,forbidden} from "../../_lib/authorization";
import {cleanSiteMenu} from "../../_lib/site-menu";
import {writeAudit} from "../../_lib/audit";
export async function GET(request:Request){if(!await requireAdmin(request))return forbidden();const row=(await getDb().select().from(appConfigurations).where(eq(appConfigurations.id,"site-menu")).limit(1))[0];return Response.json({items:cleanSiteMenu(row?.value.items)})}
export async function PUT(request:Request){const admin=await requireAdmin(request);if(!admin)return forbidden();let value;try{value=await request.json()}catch{return Response.json({error:"INVALID_MENU"},{status:400})}if(!Array.isArray(value.items))return Response.json({error:"INVALID_MENU"},{status:400});const items=cleanSiteMenu(value.items),db=getDb(),now=new Date();await db.insert(appConfigurations).values({id:"site-menu",value:{items},createdAt:now,updatedAt:now}).onConflictDoUpdate({target:appConfigurations.id,set:{value:{items},updatedAt:now}});await writeAudit(db,admin,"site_menu.updated","configuration","site-menu","منوی مستقل سایت ذخیره شد.",{count:items.length});return Response.json({ok:true,items})}
