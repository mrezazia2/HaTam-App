export function numericInput(value:string){return value.replace(/[۰-۹]/g,x=>String(x.charCodeAt(0)-1776)).replace(/[٠-٩]/g,x=>String(x.charCodeAt(0)-1632)).replace(/\D/g,"")}
export type PropertyFilters={minPrice:string;maxPrice:string;minArea?:string;maxArea?:string;beds?:number;regions?:string[];neighborhoods?:string[];minBuildYear?:string;maxBuildYear?:string;amenities?:string[];latitude?:number;longitude?:number;radius?:number};
type Filterable={amount?:number;size:number;beds:number;district?:string;area:string;buildingYear?:number;amenities?:string[];latitude?:number|null;longitude?:number|null};
const distance=(aLat:number,aLng:number,bLat:number,bLng:number)=>{const rad=Math.PI/180,dLat=(bLat-aLat)*rad,dLng=(bLng-aLng)*rad,x=Math.sin(dLat/2)**2+Math.cos(aLat*rad)*Math.cos(bLat*rad)*Math.sin(dLng/2)**2;return 12742000*Math.asin(Math.sqrt(x))};
export function matchesProperty(p:Filterable,f:PropertyFilters){
 if(f.minPrice&&Number(p.amount)<Number(f.minPrice)||f.maxPrice&&Number(p.amount)>Number(f.maxPrice))return false;
 if(f.minArea&&p.size<Number(f.minArea)||f.maxArea&&p.size>Number(f.maxArea))return false;
 if(f.beds&&p.beds<f.beds)return false;
 if(f.regions?.length&&!f.regions.includes(p.district||""))return false;
 if(f.neighborhoods?.length&&!f.neighborhoods.some(x=>p.area.includes(x)))return false;
 if(f.minBuildYear&&(!p.buildingYear||p.buildingYear<Number(f.minBuildYear)))return false;
 if(f.maxBuildYear&&(!p.buildingYear||p.buildingYear>Number(f.maxBuildYear)))return false;
 if(f.latitude!=null&&f.longitude!=null&&f.radius&&(
  p.latitude==null||p.longitude==null||distance(f.latitude,f.longitude,p.latitude,p.longitude)>f.radius
 ))return false;
 return !f.amenities?.length||f.amenities.every(x=>p.amenities?.includes(x));
}
