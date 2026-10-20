import {getDb} from "../../../../db";
import {appConfigurations} from "../../../../db/schema";
import {forbidden,requireAdmin} from "../../_lib/authorization";
import {navigationConfig} from "../../_lib/navigation";
import {writeAudit} from "../../_lib/audit";
import {sanitizeNavigationConfig} from "../../../navigation/config";
export const dynamic="force-dynamic";
export async function GET(request:Request){if(!await requireAdmin(request))return forbidden();return Response.json({ok:true,config:await navigationConfig()})}
export async function POST(request:Request){const admin=await requireAdmin(request);if(!admin)return forbidden();let input:unknown;try{input=await request.json()}catch{return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400})}const config=sanitizeNavigationConfig(input),db=getDb(),now=new Date();await db.insert(appConfigurations).values({id:"navigation-settings",value:config,createdAt:now,updatedAt:now}).onConflictDoUpdate({target:appConfigurations.id,set:{value:config,updatedAt:now}});await writeAudit(db,admin,"navigation_settings.update","app_configuration","navigation-settings","مسیرهای ورود و خروج و نمایش نقشه ویرایش شد.",{mapEnabled:config.mapEnabled});return Response.json({ok:true,config})}
