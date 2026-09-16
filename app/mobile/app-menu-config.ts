export type AppMenuAction="home"|"urgent"|"featured"|"consultants"|"contact"|"login"|"register-property"|"url";
export type AppMenuItem={id:string;label:string;subtitle:string;icon:string;action:AppMenuAction;target:string;variant:"item"|"cta";enabled:boolean;sortOrder:number};

export const defaultAppMenuItems:AppMenuItem[]=[
 {id:"home",label:"صفحه اصلی",subtitle:"",icon:"home",action:"home",target:"",variant:"item",enabled:true,sortOrder:10},
 {id:"trust",label:"اعتماد شما",subtitle:"",icon:"heart",action:"url",target:"/trust",variant:"item",enabled:true,sortOrder:15},
 {id:"urgent",label:"فروش سریع",subtitle:"",icon:"rocket",action:"urgent",target:"",variant:"item",enabled:true,sortOrder:20},
 {id:"vip",label:"مشتریان VIP",subtitle:"",icon:"person",action:"featured",target:"",variant:"item",enabled:true,sortOrder:30},
 {id:"featured",label:"املاک ویژه",subtitle:"",icon:"bookmark",action:"featured",target:"",variant:"item",enabled:true,sortOrder:40},
 {id:"cooperate",label:"همکاری با ما",subtitle:"",icon:"consultant",action:"consultants",target:"/register/consultant",variant:"item",enabled:true,sortOrder:50},
 {id:"contact",label:"آدرس و ارتباط",subtitle:"",icon:"contact",action:"contact",target:"/contact",variant:"item",enabled:true,sortOrder:60},
 {id:"register",label:"ثبت فوری ملک",subtitle:"ارزیابی و فروش در ۷۲ ساعت",icon:"plus",action:"register-property",target:"",variant:"cta",enabled:true,sortOrder:70},
];
