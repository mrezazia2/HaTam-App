import {publicProperty} from "../_lib/public-property";
import {and,desc,eq,gte,inArray,lte} from "drizzle-orm";
import {getDb} from "../../../db";
import {properties,propertyMedia,propertyStatusHistory} from "../../../db/schema";
import {getRequestAccount} from "../_lib/authorization";
import {writeAudit} from "../_lib/audit";
import {getUploadSettings} from "../_lib/upload-settings";
import {navigationConfig} from "../_lib/navigation";
import {matchesProperty,parsePropertyFilters,propertyBuildingYear} from "../../mobile/property-filters";

export const dynamic="force-dynamic";
const transactionTypes=["sale","rent","presale"] as const;

export async function GET(request:Request){
 const url=new URL(request.url),account=await getRequestAccount(request),mine=url.searchParams.get("scope")==="mine",consultantId=url.searchParams.get("consultantId"),db=getDb();
 if(mine){if(!account)return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});const rows=await db.select().from(properties).where(account.role==="agency"&&account.agencyId?eq(properties.agencyId,account.agencyId):account.role==="consultant"?eq(properties.consultantAccountId,account.id):eq(properties.ownerAccountId,account.id)).orderBy(desc(properties.updatedAt));return Response.json({ok:true,items:rows})}
 const filters=parsePropertyFilters(url.searchParams),conditions=[eq(properties.status,"published")];
 if(url.searchParams.get('featured')==='1')conditions.push(eq(properties.featured,true));
 if(consultantId)conditions.push(eq(properties.consultantAccountId,consultantId));
 if(filters?.minPrice)conditions.push(gte(properties.price,Number(filters.minPrice)));
 if(filters?.maxPrice)conditions.push(lte(properties.price,Number(filters.maxPrice)));
 if(filters?.minArea)conditions.push(gte(properties.area,Number(filters.minArea)));
 if(filters?.maxArea)conditions.push(lte(properties.area,Number(filters.maxArea)));
 if(filters?.beds)conditions.push(gte(properties.bedrooms,filters.beds));
 if(filters?.regions?.length)conditions.push(inArray(properties.district,filters.regions));
 const rows=await db.select().from(properties).where(and(...conditions)).orderBy(desc(properties.featured),desc(properties.updatedAt));
 const selected=filters?rows.filter(row=>{let details:Record<string,unknown>={};try{const parsed=JSON.parse(row.description);if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed))details=parsed}catch{}return matchesProperty({amount:row.price,size:row.area,beds:row.bedrooms,district:row.district||undefined,area:`${row.address} ${details.neighborhood||""}`,buildingYear:propertyBuildingYear(details),amenities:Array.isArray(details.amenities)?details.amenities.map(String):[],latitude:row.latitude,longitude:row.longitude},filters)}):rows;
 return Response.json({ok:true,items:selected.map(publicProperty)});
}

export async function POST(request:Request){
 const account=await getRequestAccount(request);if(!account||account.status!=="active")return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});const value=await request.json() as Record<string,unknown>,title=String(value.title||"").trim(),address=String(value.address||"").trim(),transactionType=String(value.transactionType||""),area=Number(value.area),price=Number(value.price),bedrooms=Number(value.bedrooms||0),latitude=value.latitude==null?null:Number(value.latitude),longitude=value.longitude==null?null:Number(value.longitude),mapEnabled=(await navigationConfig()).mapEnabled;
 if(title.length<3||address.length<5||!transactionTypes.includes(transactionType as typeof transactionTypes[number])||!Number.isFinite(area)||area<=0||!Number.isFinite(price)||price<0||(mapEnabled&&(latitude==null||longitude==null))||(latitude!=null&&(!Number.isFinite(latitude)||latitude<-90||latitude>90))||(longitude!=null&&(!Number.isFinite(longitude)||longitude<-180||longitude>180)))return Response.json({ok:false,error:"INVALID_PROPERTY"},{status:400});
 const mediaKeys=Array.from(new Set(Array.isArray(value.mediaKeys)?value.mediaKeys.map(String):[])).filter(Boolean),uploadSettings=await getUploadSettings();if(mediaKeys.length>uploadSettings.maxPropertyFiles)return Response.json({ok:false,error:"TOO_MANY_MEDIA"},{status:400});const db=getDb(),ownedMedia=mediaKeys.length?await db.select().from(propertyMedia).where(and(inArray(propertyMedia.objectKey,mediaKeys),eq(propertyMedia.ownerAccountId,account.id),eq(propertyMedia.status,"active"))):[];if(ownedMedia.length!==mediaKeys.length||ownedMedia.some(x=>x.propertyId||x.urgentSaleId))return Response.json({ok:false,error:"INVALID_MEDIA_OWNERSHIP"},{status:403});
 const timestamp=new Date(),id=`HT-${crypto.randomUUID()}`,status=value.submitForReview===false?"draft":"pending",requestedCover=String(value.coverImage||""),coverImage=ownedMedia.find(x=>requestedCover.includes(encodeURIComponent(x.objectKey))||requestedCover.includes(x.objectKey))?requestedCover:(ownedMedia.find(x=>x.contentType.startsWith("image/"))?`/api/property-media?key=${encodeURIComponent(ownedMedia.find(x=>x.contentType.startsWith("image/"))!.objectKey)}`:null);
 await db.insert(properties).values({id,title,ownerAccountId:account.role==="user"?account.id:null,consultantAccountId:account.role==="consultant"?account.id:null,agencyId:account.role==="agency"?account.agencyId:null,ownerMobile:String(value.ownerMobile||account.mobile),address,district:String(value.district||"")||null,latitude,longitude,transactionType:transactionType as typeof transactionTypes[number],propertyType:String(value.propertyType||"apartment"),area:Math.round(area),bedrooms:Math.max(0,Math.round(bedrooms)),price:Math.round(price),description:String(value.description||""),coverImage,status,featured:false,createdAt:timestamp,updatedAt:timestamp});
 if(mediaKeys.length)await db.update(propertyMedia).set({propertyId:id,updatedAt:timestamp}).where(and(inArray(propertyMedia.objectKey,mediaKeys),eq(propertyMedia.ownerAccountId,account.id)));
 await db.insert(propertyStatusHistory).values({id:`PH-${crypto.randomUUID()}`,propertyId:id,actorAccountId:account.id,fromStatus:null,toStatus:status,note:status==="pending"?"ارسال اولیه برای بررسی":"ذخیره پیش‌نویس",createdAt:timestamp});await writeAudit(db,account,"property.created","property",id,"ملک جدید ثبت شد.",{status,mediaCount:mediaKeys.length});return Response.json({ok:true,id,status},{status:201});
}
