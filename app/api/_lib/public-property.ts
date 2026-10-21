// Structured submissions include private brokerage fields; never publish the raw object.
export function publicDescription(value:string){
 try{
  const parsed=JSON.parse(value);
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))return "";
  const allowed=["amenities","deeds","occupancy","area","bedrooms","age","buildingYear","buildYear","floor","floors","totalFloors","units","unitsPerFloor","buildingAge","facade","passage","neighborhood","region","description"];
  return JSON.stringify(Object.fromEntries(allowed.filter(key=>Object.hasOwn(parsed,key)).map(key=>[key,parsed[key]])));
 }catch{return value}
}
export function publicProperty<T extends {ownerMobile:string;ownerAccountId:string|null;description:string}>(row:T){
 const {ownerMobile,ownerAccountId,...rest}=row;
 return {...rest,description:publicDescription(row.description)};
}
