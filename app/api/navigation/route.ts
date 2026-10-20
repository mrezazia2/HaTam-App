import {navigationConfig} from "../_lib/navigation";
export const dynamic="force-dynamic";
export async function GET(){const config=await navigationConfig();return Response.json({ok:true,mapEnabled:config.mapEnabled,siteLogout:config.siteLogout,appLogout:config.appLogout,siteLogin:config.siteLogin,siteMenu:config.siteMenu},{headers:{"cache-control":"no-store"}})}
