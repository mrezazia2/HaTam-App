import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { brandSettings,appConfigurations } from "../../../db/schema";
import { forbidden, requireAdmin } from "../_lib/authorization";
import {writeAudit} from "../_lib/audit";
import {cleanAppearance,defaultAppearance} from "../../brand/appearance";

export const dynamic="force-dynamic";
export async function GET(){const db=getDb();const [row,appearanceRow]=await Promise.all([(db.select().from(brandSettings).where(eq(brandSettings.id,"default")).limit(1)).then(rows=>rows[0]),(db.select().from(appConfigurations).where(eq(appConfigurations.id,"brand-appearance")).limit(1)).then(rows=>rows[0])]);return Response.json({ok:true,settings:row?{brandName:row.brandName,slogan:row.slogan,logoUrl:row.logoUrl,faviconUrl:row.faviconUrl,primaryColor:row.primaryColor,secondaryColor:row.secondaryColor,accentColor:row.accentColor,fontFamily:row.fontFamily,typeScale:row.typeScale,appearance:cleanAppearance(appearanceRow?.value)}:{appearance:defaultAppearance}});}
export async function POST(request:Request){
 const admin=await requireAdmin(request);if(!admin)return forbidden();
 const value=await request.json() as Record<string,unknown>,db=getDb();
 const previous=(await db.select().from(brandSettings).where(eq(brandSettings.id,"default")).limit(1))[0];
 const asset=(input:unknown,kind:"logoUrl"|"faviconUrl")=>typeof input==="string"&&(
   /^\/api\/brand-assets\?key=brand%2F(?:logo|favicon)-[a-f0-9-]+\.(?:png|jpg|jpeg|webp|ico)$/.test(input)
   || /^\/(?:assets\/hatam\/[\w.-]+|favicon\.svg)$/.test(input)
   || Boolean(previous&&input===previous[kind])
 );
 const color=(input:unknown)=>typeof input==="string"&&/^#[0-9a-fA-F]{6}$/.test(input);
 if(!asset(value.logoUrl,"logoUrl")||!asset(value.faviconUrl,"faviconUrl")||!color(value.primaryColor)||!color(value.secondaryColor)||!color(value.accentColor))return Response.json({ok:false,error:"INVALID_BRAND_SETTINGS"},{status:400});
 const timestamp=new Date(),data={brandName:String(value.brandName||"").trim().slice(0,100),slogan:String(value.slogan||"").trim().slice(0,160),logoUrl:String(value.logoUrl),faviconUrl:String(value.faviconUrl),primaryColor:String(value.primaryColor),secondaryColor:String(value.secondaryColor),accentColor:String(value.accentColor),fontFamily:["Vazirmatn","Tahoma","Arial"].includes(String(value.fontFamily))?String(value.fontFamily):"Vazirmatn",typeScale:Math.min(1.5,Math.max(.8,Number(value.typeScale)||1))};
 await db.insert(brandSettings).values({id:"default",...data,createdAt:timestamp,updatedAt:timestamp}).onConflictDoUpdate({target:brandSettings.id,set:{...data,updatedAt:timestamp}});
 const appearance=cleanAppearance(value.appearance);
 await db.insert(appConfigurations).values({id:"brand-appearance",value:appearance as unknown as Record<string,unknown>,createdAt:timestamp,updatedAt:timestamp}).onConflictDoUpdate({target:appConfigurations.id,set:{value:appearance as unknown as Record<string,unknown>,updatedAt:timestamp}});
 await writeAudit(db,admin,"brand.update","brand_settings","default","هویت بصری به‌روزرسانی شد.",{});
 return Response.json({ok:true});
}
export async function DELETE(request:Request){const admin=await requireAdmin(request);if(!admin)return forbidden();const db=getDb();await db.delete(brandSettings).where(eq(brandSettings.id,"default"));await db.delete(appConfigurations).where(eq(appConfigurations.id,"brand-appearance"));await writeAudit(db,admin,"brand.reset","brand_settings","default","هویت بصری بازنشانی شد.",{});return Response.json({ok:true});}
