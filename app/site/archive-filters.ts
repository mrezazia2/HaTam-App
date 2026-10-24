import {propertyBuildingYear} from "../mobile/property-filters.ts";
export const emptyArchiveFilters={minPrice:"",maxPrice:"",minSize:"",maxSize:"",minYear:"",maxYear:"",beds:"",floors:"",units:"",amenities:[] as string[]};
export function matchesArchiveFilters(property:{price:number;area:number;bedrooms:number;description?:string},filters:typeof emptyArchiveFilters){
 let details:Record<string,unknown>={};
 try{const parsed=JSON.parse(property.description||"");if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed))details=parsed}catch{}
 const year=propertyBuildingYear(details),amenities=Array.isArray(details.amenities)?details.amenities:[];
 return (!filters.minPrice||property.price>=Number(filters.minPrice))&&(!filters.maxPrice||property.price<=Number(filters.maxPrice))
 &&(!filters.minSize||property.area>=Number(filters.minSize))&&(!filters.maxSize||property.area<=Number(filters.maxSize))
 &&(!filters.beds||property.bedrooms>=Number(filters.beds))
 &&(!filters.minYear||(year!==undefined&&year>=Number(filters.minYear)))&&(!filters.maxYear||(year!==undefined&&year<=Number(filters.maxYear)))
 &&(!Number(filters.floors)||Number(details.totalFloors||details.floors)===Number(filters.floors))
 &&(!Number(filters.units)||Number(details.unitsPerFloor||details.units)===Number(filters.units))
 &&filters.amenities.every(value=>amenities.includes(value)||(value==="پارکینگ موتور"&&amenities.includes("پارک موتور")));
}
