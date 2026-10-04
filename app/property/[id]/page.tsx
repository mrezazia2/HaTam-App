import {publicDescription} from "../../api/_lib/public-property";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "../../../db";
import { properties, propertyMedia } from "../../../db/schema";
import PropertyDetail from "./PropertyDetail";
import type { Metadata } from "next";

export const dynamic="force-dynamic";
async function loadProperty(id:string){return (await getDb().select().from(properties).where(eq(properties.id,id)).limit(1))[0]}
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const {id}=await params,property=await loadProperty(id);if(!property||property.status!=="published")return{title:"ملک یافت نشد | املاک حاتم"};const description=`${property.area.toLocaleString("fa-IR")} متر، ${property.bedrooms.toLocaleString("fa-IR")} خواب، ${property.address}`;return{title:`${property.title} | املاک حاتم`,description,openGraph:{title:property.title,description,type:"article",images:property.coverImage?[property.coverImage]:[]}}}
export default async function PropertyPage({params}:{params:Promise<{id:string}>}){const {id}=await params,db=getDb();const property=await loadProperty(id);if(!property||property.status!=="published")notFound();const media=await db.select().from(propertyMedia).where(and(eq(propertyMedia.propertyId,id),eq(propertyMedia.status,"active")));return <PropertyDetail property={{id:property.id,title:property.title,address:property.address,area:property.area,bedrooms:property.bedrooms,price:property.price,description:publicDescription(property.description),coverImage:property.coverImage,transactionType:property.transactionType,latitude:property.latitude,longitude:property.longitude,media:media.map(item=>({key:item.objectKey,url:`/api/property-media?key=${encodeURIComponent(item.objectKey)}`,name:item.fileName,type:item.contentType}))}}/>}
