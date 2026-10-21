import {neighborhoodSearchName} from './tehran-neighborhoods.ts';
export function numericInput(value:string){return value.replace(/[۰-۹]/g,x=>String(x.charCodeAt(0)-1776)).replace(/[٠-٩]/g,x=>String(x.charCodeAt(0)-1632)).replace(/\D/g,"")}
export type PropertyFilters={minPrice:string;maxPrice:string;minArea?:string;maxArea?:string;beds?:number;regions?:string[];neighborhoods?:string[];minBuildYear?:string;maxBuildYear?:string;amenities?:string[];latitude?:number;longitude?:number;radius?:number};
const filterKeys=["minPrice","maxPrice","minArea","maxArea","beds","regions","neighborhoods","minBuildYear","maxBuildYear","amenities","latitude","longitude","radius"] as const;
export function propertyFilterQuery(filters:PropertyFilters){const query=new URLSearchParams();for(const key of filterKeys){const value=filters[key];if(Array.isArray(value)){for(const item of value)if(item)query.append(key,item)}else if(value!==undefined&&value!==null&&value!=="")query.set(key,String(value))}return query}
export function parsePropertyFilters(query:URLSearchParams):PropertyFilters|undefined{
 if(!filterKeys.some(key=>query.has(key)))return undefined;
 const number=(key:string)=>{const raw=numericInput(query.get(key)||"");return raw?String(Math.min(Number(raw),1_000_000_000_000_000)):""};
 const list=(key:string)=>query.getAll(key).flatMap(value=>value.split(",")).map(value=>value.trim()).filter(Boolean).slice(0,30);
 const decimal=(key:string)=>{const raw=query.get(key);if(raw===null||raw==="")return undefined;const value=Number(raw);return Number.isFinite(value)?value:undefined};
 return {minPrice:number("minPrice"),maxPrice:number("maxPrice"),minArea:number("minArea"),maxArea:number("maxArea"),beds:Number(number("beds"))||0,regions:list("regions"),neighborhoods:list("neighborhoods"),minBuildYear:number("minBuildYear"),maxBuildYear:number("maxBuildYear"),amenities:list("amenities"),latitude:decimal("latitude"),longitude:decimal("longitude"),radius:Math.min(Number(number("radius"))||0,50_000)};
}
export function propertyBuildingYear(details:Record<string,unknown>,now=new Date()){
 const direct=Number(details.buildYear||details.buildingYear||details.buildingAge);if(direct>=1300&&direct<=1500)return direct;
 const age=Number(details.age);if(age>=1300&&age<=1500)return age;
 if(age>=0&&age<=200&&details.age!==undefined){const year=Number(new Intl.DateTimeFormat("en-US-u-ca-persian",{year:"numeric"}).formatToParts(now).find(part=>part.type==="year")?.value);return Number.isFinite(year)?year-age:undefined}
 return undefined;
}
type Filterable={amount?:number;size:number;beds:number;district?:string;area:string;buildingYear?:number;amenities?:string[];latitude?:number|null;longitude?:number|null};
const distance=(aLat:number,aLng:number,bLat:number,bLng:number)=>{const rad=Math.PI/180,dLat=(bLat-aLat)*rad,dLng=(bLng-aLng)*rad,x=Math.sin(dLat/2)**2+Math.cos(aLat*rad)*Math.cos(bLat*rad)*Math.sin(dLng/2)**2;return 12742000*Math.asin(Math.sqrt(x))};
export function matchesProperty(p:Filterable,f:PropertyFilters){
 if(f.minPrice&&Number(p.amount)<Number(f.minPrice)||f.maxPrice&&Number(p.amount)>Number(f.maxPrice))return false;
 if(f.minArea&&p.size<Number(f.minArea)||f.maxArea&&p.size>Number(f.maxArea))return false;
 if(f.beds&&p.beds<f.beds)return false;
 if(f.regions?.length&&!f.regions.includes(p.district||""))return false;
 if(f.neighborhoods?.length&&!f.neighborhoods.some(x=>neighborhoodSearchName(p.area).includes(neighborhoodSearchName(x))))return false;
 if(f.minBuildYear&&(!p.buildingYear||p.buildingYear<Number(f.minBuildYear)))return false;
 if(f.maxBuildYear&&(!p.buildingYear||p.buildingYear>Number(f.maxBuildYear)))return false;
 if(f.latitude!=null&&f.longitude!=null&&f.radius&&(
  p.latitude==null||p.longitude==null||distance(f.latitude,f.longitude,p.latitude,p.longitude)>f.radius
 ))return false;
 return !f.amenities?.length||f.amenities.every(x=>p.amenities?.includes(x));
}
