export type AppearanceScope="site"|"app"|"panel"|"user"|"consultant"|"agency"|"admin";
export const appearanceScopes:AppearanceScope[]=["site","app","panel","user","consultant","agency","admin"];
export type AppearancePalette={background:string;surface:string;text:string;primary:string;accent:string};
export type ScopedAppearance={fontFamily:string;fontScale:number;light:AppearancePalette;dark:AppearancePalette};
export type AppearanceSettings=Record<AppearanceScope,ScopedAppearance>;

const light:AppearancePalette={background:"#f4f2eb",surface:"#fffdf8",text:"#10271f",primary:"#063326",accent:"#b68a36"};
const dark:AppearancePalette={background:"#031812",surface:"#06291f",text:"#edf4f0",primary:"#063326",accent:"#d7ae58"};
const make=():ScopedAppearance=>({fontFamily:"Vazirmatn",fontScale:1,light:{...light},dark:{...dark}});
export const defaultAppearance:AppearanceSettings={site:make(),app:make(),panel:make(),user:make(),consultant:make(),agency:make(),admin:make()};
const hex=(value:unknown,fallback:string)=>typeof value==="string"&&/^#[0-9a-fA-F]{6}$/.test(value)?value:fallback;
const fonts=["Vazirmatn","Tahoma","Arial"];
export function cleanAppearance(value:unknown):AppearanceSettings{
 const input=value&&typeof value==="object"?value as Record<string,unknown>:{};
 return Object.fromEntries(appearanceScopes.map(scope=>{
   const source=input[scope]??(scope!=="site"&&scope!=="app"?input.panel:undefined);
   const raw=source&&typeof source==="object"?source as Record<string,unknown>:{};
   const fallback=defaultAppearance[scope];
   const palette=(mode:"light"|"dark")=>{const colors=raw[mode]&&typeof raw[mode]==="object"?raw[mode] as Record<string,unknown>:{};return Object.fromEntries((Object.keys(fallback[mode]) as (keyof AppearancePalette)[]).map(key=>[key,hex(colors[key],fallback[mode][key])])) as AppearancePalette};
   const scale=Number(raw.fontScale);
   return [scope,{fontFamily:fonts.includes(String(raw.fontFamily))?String(raw.fontFamily):fallback.fontFamily,fontScale:Number.isFinite(scale)?Math.min(1.4,Math.max(.85,scale)):1,light:palette("light"),dark:palette("dark")}];
 })) as AppearanceSettings;
}
