import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { brandSettings } from "../../../db/schema";
import { forbidden, requireAdmin } from "../_lib/authorization";

export const dynamic="force-dynamic";
export async function GET(){const row=(await getDb().select().from(brandSettings).where(eq(brandSettings.id,"default")).limit(1))[0];return Response.json({ok:true,settings:row?{brandName:row.brandName,slogan:row.slogan,logoUrl:row.logoUrl,faviconUrl:row.faviconUrl,primaryColor:row.primaryColor,secondaryColor:row.secondaryColor,accentColor:row.accentColor,fontFamily:row.fontFamily,typeScale:row.typeScale}:null});}
export async function POST(request:Request){if(!await requireAdmin(request))return forbidden();const value=await request.json() as Record<string,any>;const timestamp=new Date();await getDb().insert(brandSettings).values({id:"default",brandName:value.brandName,slogan:value.slogan,logoUrl:value.logoUrl,faviconUrl:value.faviconUrl,primaryColor:value.primaryColor,secondaryColor:value.secondaryColor,accentColor:value.accentColor,fontFamily:value.fontFamily,typeScale:Number(value.typeScale)||1,createdAt:timestamp,updatedAt:timestamp}).onConflictDoUpdate({target:brandSettings.id,set:{brandName:value.brandName,slogan:value.slogan,logoUrl:value.logoUrl,faviconUrl:value.faviconUrl,primaryColor:value.primaryColor,secondaryColor:value.secondaryColor,accentColor:value.accentColor,fontFamily:value.fontFamily,typeScale:Number(value.typeScale)||1,updatedAt:timestamp}});return Response.json({ok:true});}
export async function DELETE(request:Request){if(!await requireAdmin(request))return forbidden();await getDb().delete(brandSettings).where(eq(brandSettings.id,"default"));return Response.json({ok:true});}
