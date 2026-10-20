import {eq} from "drizzle-orm";
import {getDb} from "../../../db";
import {appConfigurations} from "../../../db/schema";
import {appSurface,defaultNavigationConfig,sanitizeNavigationConfig,type RoleDestination} from "../../navigation/config";

export async function navigationConfig(){
  try{const row=(await getDb().select({value:appConfigurations.value}).from(appConfigurations).where(eq(appConfigurations.id,"navigation-settings")).limit(1))[0];return sanitizeNavigationConfig(row?.value)}catch{return defaultNavigationConfig}
}

export async function loginDestination(request:Request,role:RoleDestination,surface?:unknown){
  const config=await navigationConfig();
  return role!=="admin"&&appSurface(request,surface)?config.appLogin[role]:config.siteLogin[role];
}
