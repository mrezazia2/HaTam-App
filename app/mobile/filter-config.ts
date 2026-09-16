export type FilterRegion={id:string;name:string;neighborhoods:string[]};
export type FilterConfig={regions:FilterRegion[];amenities:string[];buildingAges:string[];facades:string[];deedTypes:string[];occupancyTypes:string[]};

export const FILTER_CONFIG_KEY="hatam-filter-config-v1";
export const defaultFilterConfig:FilterConfig={
  regions:[
    {id:"12",name:"منطقه ۱۲",neighborhoods:["بهارستان","دروازه شمیران","سنگلج","بازار","پامنار"]},
    {id:"13",name:"منطقه ۱۳",neighborhoods:["پیروزی","نیروی هوایی","امامت","صفا","زاهد گیلانی"]},
    {id:"14",name:"منطقه ۱۴",neighborhoods:["دولاب","نبرد","چهارصد دستگاه","شکوفه","مینابی","ابوذر"]},
  ],
  amenities:["پارکینگ","آسانسور","انباری","بالکن","حیاط","پارکینگ موتور"],
  buildingAges:Array.from({length:26},(_,index)=>String(1405-index)),
  facades:["سنگ","آجر","شیشه","کامپوزیت","سیمان"],
  deedTypes:["نوساز","تک‌برگ","دفترچه‌ای"],
  occupancyTypes:["تخلیه","آماده به تخلیه","مستأجر"],
};

export function normalizeFilterConfig(value?:Partial<FilterConfig>|null):FilterConfig{
  const merged={...defaultFilterConfig,...(value||{})};
  const years=(merged.buildingAges||[]).map(String).filter(year=>/^\d{4}$/.test(year)).filter((year,index,list)=>list.indexOf(year)===index).sort((a,b)=>Number(b)-Number(a));
  return {...merged,buildingAges:years.length?years:defaultFilterConfig.buildingAges};
}

export function readFilterConfig():FilterConfig{
  if(typeof window==="undefined")return defaultFilterConfig;
  try{const stored=window.localStorage.getItem(FILTER_CONFIG_KEY);return stored?normalizeFilterConfig(JSON.parse(stored)):defaultFilterConfig}catch{return defaultFilterConfig}
}

export function writeFilterConfig(config:FilterConfig){
  window.localStorage.setItem(FILTER_CONFIG_KEY,JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("hatam-filter-config-changed",{detail:config}));
}

export async function fetchFilterConfig():Promise<FilterConfig>{try{const response=await fetch("/api/app-config?key=property-form",{cache:"no-store"});if(!response.ok)throw new Error();const data=await response.json();return normalizeFilterConfig(data.value||{})}catch{return readFilterConfig()}}
