export type ContactLink={id:string;label:string;url:string;enabled:boolean};
export type ContactConfig={title:string;intro:string;addressLabel:string;address:string;phones:string[];maps:ContactLink[];socials:ContactLink[]};
export const defaultContactConfig:ContactConfig={
 title:"آدرس و ارتباط با ما",
 intro:"ملاقات و هم‌صحبتی با شما باعث افتخار ماست",
 addressLabel:"آدرس دفتر",
 address:"تهران - منطقه ۱۳ - میدان امامت - خیابان طوفانی - خیابان عنصری - پلاک ۹ - ساختمان نارون",
 phones:["0912-0000000","021-12345678"],
 maps:[{id:"neshan",label:"نشان",url:"https://neshan.org/maps",enabled:true},{id:"google",label:"Google Maps",url:"https://maps.google.com",enabled:true},{id:"balad",label:"بلد",url:"https://balad.ir",enabled:true}],
 socials:[{id:"bale",label:"بله",url:"https://ble.ir",enabled:true},{id:"whatsapp",label:"واتساپ",url:"https://wa.me/989120000000",enabled:true},{id:"instagram",label:"اینستاگرام",url:"https://instagram.com",enabled:true},{id:"telegram",label:"تلگرام",url:"https://t.me",enabled:true}]
};
