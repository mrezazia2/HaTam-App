import type {MetadataRoute} from "next";

export default function manifest():MetadataRoute.Manifest{
  return {name:"املاک حاتم",short_name:"حاتم",description:"وب‌اپ مشتریان املاک حاتم؛ مسیر روشن، کار جمع",start_url:"/app?source=pwa",id:"/app",scope:"/",display:"standalone",orientation:"portrait-primary",background_color:"#031b14",theme_color:"#062c21",lang:"fa",dir:"rtl",icons:[{src:"/favicon.svg",sizes:"any",type:"image/svg+xml",purpose:"any maskable"}],shortcuts:[{name:"پنل مشتری",short_name:"پنل",url:"/panel"},{name:"جست‌وجوی ملک",short_name:"جست‌وجو",url:"/app"}]};
}
