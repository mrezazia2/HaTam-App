import { desc,eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { properties } from "../../../db/schema";
import { createAiRequest,getAiConfig,readAiOutput } from "../_lib/ai";

export const dynamic="force-dynamic";
type Message={role:"user"|"assistant";content:string};
const faDigits="۰۱۲۳۴۵۶۷۸۹";
function normalize(value:string){return value.replace(/[۰-۹]/g,d=>String(faDigits.indexOf(d))).replace(/[٬،]/g,",").toLowerCase()}
function requestedArea(text:string){const normalized=normalize(text),match=normalized.match(/(\d{2,4})\s*(?:متر|متری)/);return match?Number(match[1]):null}
function requestedBudget(text:string){const normalized=normalize(text).replace(/,/g,""),match=normalized.match(/(\d+(?:\.\d+)?)\s*(میلیارد|میلیون)?/g);if(!match)return null;const values=match.map(raw=>{const n=Number(raw.match(/\d+(?:\.\d+)?/)?.[0]||0);return raw.includes("میلیارد")?n*1_000_000_000:raw.includes("میلیون")?n*1_000_000:n}).filter(n=>n>10_000_000);return values.length?Math.max(...values):null}
function scoreProperty(property:{title:string;address:string;district:string|null;area:number;price:number;bedrooms:number;featured:boolean},query:string){const hay=normalize(`${property.title} ${property.address} ${property.district||""}`),words=normalize(query).split(/\s+/).filter(word=>word.length>2),area=requestedArea(query),budget=requestedBudget(query);let score=property.featured?3:0;score+=words.reduce((sum,word)=>sum+(hay.includes(word)?4:0),0);if(area)score+=Math.max(0,8-Math.abs(property.area-area)/15);if(budget&&property.price)score+=Math.max(0,8-Math.abs(property.price-budget)/Math.max(budget*.15,1));return score}
export async function POST(request:Request){
 try{
  const body=await request.json() as {message?:string;history?:Message[]},message=String(body.message||"").trim();
  if(message.length<2||message.length>1000)return Response.json({ok:false,message:"پیام معتبر وارد کنید."},{status:400});
  const config=await getAiConfig();if(!config.enabled)return Response.json({ok:false,message:"دستیار هوشمند موقتاً غیرفعال است."},{status:503});if(!config.apiKey)return Response.json({ok:false,message:"کلید اتصال هوش مصنوعی در پنل ادمین تنظیم نشده است."},{status:503});
  const rows=await getDb().select({id:properties.id,title:properties.title,address:properties.address,district:properties.district,transactionType:properties.transactionType,propertyType:properties.propertyType,area:properties.area,bedrooms:properties.bedrooms,price:properties.price,description:properties.description,coverImage:properties.coverImage,featured:properties.featured,updatedAt:properties.updatedAt}).from(properties).where(eq(properties.status,"published")).orderBy(desc(properties.featured),desc(properties.updatedAt)).limit(config.propertyLimit);
  const ranked=[...rows].sort((a,b)=>scoreProperty(b,message)-scoreProperty(a,message)),matches=ranked.slice(0,3);
  const catalog=ranked.slice(0,20).map(item=>({id:item.id,title:item.title,district:item.district,address:item.address,transactionType:item.transactionType,propertyType:item.propertyType,area:item.area,bedrooms:item.bedrooms,priceToman:item.price,description:item.description?.slice(0,240)}));
  const history=(body.history||[]).slice(-8).filter(item=>item&&(item.role==="user"||item.role==="assistant")).map(item=>({role:item.role,content:String(item.content).slice(0,1000)}));
  const requestConfig=createAiRequest(config,[...history,{role:"user",content:`درخواست مشتری: ${message}\n\nفایل‌های منتشرشده مجاز:\n${JSON.stringify(catalog)}`}],`${config.systemPrompt}\nاطلاعات خصوصی، شماره تماس و فایل‌های تاییدنشده در دسترس نیست. قیمت‌ها تومان هستند. سه پیشنهاد نزدیک‌تر از قبل امتیازدهی شده‌اند. شناسه فایل را در پاسخ بیاور.`),response=await fetch(requestConfig.url,{method:"POST",headers:requestConfig.headers,body:JSON.stringify(requestConfig.body),signal:AbortSignal.timeout(config.timeoutMs)});
  const data=await response.json();if(!response.ok)return Response.json({ok:true,degraded:true,reply:matches.length?"سرویس گفت‌وگو موقتاً در دسترس نیست، اما نزدیک‌ترین فایل‌های منتشرشده را بر اساس متراژ، بودجه و موقعیت برایتان پیدا کردم.":"سرویس گفت‌وگو موقتاً در دسترس نیست و هنوز فایل منتشرشده منطبقی پیدا نشد.",matches:matches.map(item=>({id:item.id,title:item.title,address:item.address,district:item.district,area:item.area,bedrooms:item.bedrooms,price:item.price,coverImage:item.coverImage}))});
  const reply=readAiOutput(data,config.adapter)||"چند فایل نزدیک به درخواست شما پیدا کردم.";
  return Response.json({ok:true,reply,matches:matches.map(item=>({id:item.id,title:item.title,address:item.address,district:item.district,area:item.area,bedrooms:item.bedrooms,price:item.price,coverImage:item.coverImage}))});
 }catch(error){return Response.json({ok:false,message:error instanceof Error&&error.name==="TimeoutError"?"زمان پاسخ دستیار به پایان رسید؛ دوباره تلاش کنید.":"ارتباط با دستیار هوشمند برقرار نشد."},{status:502})}
}
