export type ContactLink={id:string;label:string;url:string;enabled:boolean};
export type ContactConfig={title:string;intro:string;addressLabel:string;address:string;phones:string[];maps:ContactLink[];socials:ContactLink[]};
export const defaultContactConfig:ContactConfig={
 title:"آدرس و ارتباط با ما",
 intro:"ملاقات و هم‌صحبتی با شما باعث افتخار ماست",
 addressLabel:"آدرس دفتر",
 address:"تهران - منطقه ۱۳ - میدان امامت - خیابان طوفانی - خیابان عنصری - پلاک ۹ - ساختمان نارون",
 phones:["+98 21 7741 5003","09374270641"],
 maps:[{id:"neshan",label:"نشان",url:"https://neshan.org/maps",enabled:true},{id:"google",label:"Google Maps",url:"https://maps.google.com",enabled:true},{id:"balad",label:"بلد",url:"https://balad.ir",enabled:true}],
 socials:[{id:"bale",label:"بله",url:"",enabled:false},{id:"whatsapp",label:"واتساپ",url:"https://wa.me/989374270641",enabled:true},{id:"instagram",label:"اینستاگرام",url:"https://www.instagram.com/hatamestate?obrf=MWo5a21xcmsyc3F3eg==",enabled:true},{id:"telegram",label:"تلگرام",url:"https://t.me/YasinHatam",enabled:true},{id:"rubika",label:"روبیکا",url:"",enabled:false}]
};

export function normalizeContactConfig(value:unknown):ContactConfig{
 const stored=value&&typeof value==="object"?value as Partial<ContactConfig>:{};
 const socials=Array.isArray(stored.socials)?stored.socials.map(item=>{
  if(item.id==="whatsapp"&&(!item.url||item.url==="https://wa.me/989120000000"))return {...item,url:"https://wa.me/989374270641",enabled:true};
  if(["https://ble.ir","https://t.me","https://instagram.com"].includes(item.url))return {...item,url:"",enabled:false};
  return item;
 }):[...defaultContactConfig.socials];
 if(!socials.some(item=>item.id==="rubika"))socials.push({id:"rubika",label:"روبیکا",url:"",enabled:false});
 return {...defaultContactConfig,...stored,socials};
}
