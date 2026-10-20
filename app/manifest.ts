import type {MetadataRoute} from "next";

export default function manifest():MetadataRoute.Manifest{
  return {name:"املاک حاتم",short_name:"حاتم",description:"وب‌اپ مشتریان املاک حاتم؛ مسیر روشن، کار جمع",start_url:"/app?source=pwa",id:"/app",scope:"/",display:"standalone",orientation:"portrait-primary",background_color:"#031b14",theme_color:"#062c21",lang:"fa",dir:"rtl",icons:[{src:"/icons/hatam-install-v2-192.png",sizes:"192x192",type:"image/png",purpose:"any"},{src:"/icons/hatam-install-v2-512.png",sizes:"512x512",type:"image/png",purpose:"any"}],shortcuts:[{name:"خانه وب‌اپ",short_name:"حاتم",url:"/app"},{name:"جست‌وجوی ملک",short_name:"جست‌وجو",url:"/app?screen=search"}]};
}
