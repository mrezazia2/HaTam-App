export type RoleDestination = "user" | "consultant" | "agency" | "admin";
export type SiteMenuKey="home"|"ai"|"properties"|"consultants"|"blog"|"notifications"|"favorites";
export type NavigationConfig = {
  siteLogin: Record<RoleDestination, string>;
  appLogin: Record<Exclude<RoleDestination,"admin">, string>;
  siteLogout: string;
  appLogout: string;
  mapEnabled: boolean;
  siteMenu:Record<SiteMenuKey,string>;
};

export const defaultNavigationConfig: NavigationConfig = {
  siteLogin: {user:"/panel",consultant:"/consultant",agency:"/agency",admin:"/admin"},
  appLogin: {user:"/app",consultant:"/app",agency:"/app"},
  siteLogout:"/login",appLogout:"/app",
  mapEnabled:true,
  siteMenu:{home:"/",ai:"/ai-search",properties:"/properties",consultants:"/consultants",blog:"/blog",notifications:"/notifications",favorites:"/favorites"},
};

export function safeLocalPath(value:unknown,fallback:string){
  if(typeof value!=="string"||!value.startsWith("/")||value.startsWith("//")||value.includes("\\")||/[\u0000-\u001f]/.test(value))return fallback;
  try{const url=new URL(value,"https://hatamestate.com");return url.origin==="https://hatamestate.com"?`${url.pathname}${url.search}${url.hash}`:fallback}catch{return fallback}
}

export function sanitizeNavigationConfig(value:unknown):NavigationConfig{
  const row=value&&typeof value==="object"?value as Partial<NavigationConfig>:{};
  const site=row.siteLogin||{} as NavigationConfig["siteLogin"],app=row.appLogin||{} as NavigationConfig["appLogin"];
  const menu=row.siteMenu||{} as NavigationConfig["siteMenu"];
  return {
    siteLogin:{user:safeLocalPath(site.user,defaultNavigationConfig.siteLogin.user),consultant:safeLocalPath(site.consultant,defaultNavigationConfig.siteLogin.consultant),agency:safeLocalPath(site.agency,defaultNavigationConfig.siteLogin.agency),admin:safeLocalPath(site.admin,defaultNavigationConfig.siteLogin.admin)},
    appLogin:{user:safeLocalPath(app.user,defaultNavigationConfig.appLogin.user),consultant:safeLocalPath(app.consultant,defaultNavigationConfig.appLogin.consultant),agency:safeLocalPath(app.agency,defaultNavigationConfig.appLogin.agency)},
    siteLogout:safeLocalPath(row.siteLogout,defaultNavigationConfig.siteLogout),
    appLogout:safeLocalPath(row.appLogout,defaultNavigationConfig.appLogout),
    mapEnabled:row.mapEnabled!==false,
    siteMenu:{home:safeLocalPath(menu.home,defaultNavigationConfig.siteMenu.home),ai:safeLocalPath(menu.ai,defaultNavigationConfig.siteMenu.ai),properties:safeLocalPath(menu.properties,defaultNavigationConfig.siteMenu.properties),consultants:safeLocalPath(menu.consultants,defaultNavigationConfig.siteMenu.consultants),blog:safeLocalPath(menu.blog,defaultNavigationConfig.siteMenu.blog),notifications:safeLocalPath(menu.notifications,defaultNavigationConfig.siteMenu.notifications),favorites:safeLocalPath(menu.favorites,defaultNavigationConfig.siteMenu.favorites)},
  };
}

export function appSurface(request:Request,requested?:unknown){
  const host=new URL(request.url).hostname;
  if(host==="web.hatamestate.com"||host==="app.hatamestate.com"||requested==="app")return true;
  const referer=request.headers.get("referer");
  if(!referer)return false;
  try{const source=new URL(referer);return source.origin===new URL(request.url).origin&&source.pathname==="/app"}catch{return false}
}
