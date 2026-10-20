"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DrawingPinIcon, HeartFilledIcon, HeartIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import SiteShell from "./SiteShell";
import "./property-sort.css";
import {validCoordinates} from "../components/InteractiveMap";
import PropertyMapExplorer from '../components/PropertyMapExplorer';
import {useMapEnabled} from "../navigation/useMapEnabled";

type Property = { id:string; title:string; address:string; district?:string|null; area:number; bedrooms:number; price:number; coverImage?:string|null; featured:boolean; transactionType:string;createdAt?:string;latitude:number|null;longitude:number|null };
type Sort="cheap"|"expensive"|"newest"|"oldest";
const sortOptions:[Sort,string][]=[["cheap","ارزان‌ترین"],["expensive","گران‌ترین"],["newest","جدیدترین"],["oldest","قدیمی‌ترین"]];
export default function PropertyArchive({ featuredOnly=false }: { featuredOnly?:boolean }) {
 const mapEnabled=useMapEnabled(),[mapOpen,setMapOpen]=useState(false);
 const [items,setItems]=useState<Property[]>([]),[favorites,setFavorites]=useState<string[]>([]),[query,setQuery]=useState(""),[loading,setLoading]=useState(true),[message,setMessage]=useState(""),[sort,setSort]=useState<Sort>("newest");
 useEffect(()=>{Promise.all([fetch("/api/properties",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json()}),fetch("/api/favorites",{cache:"no-store"}).then(r=>r.ok?r.json():{items:[]})]).then(([p,f])=>{setItems(p.items||[]);setFavorites((f.items||[]).map((x:{property:Property})=>x.property.id))}).catch(()=>setMessage("دریافت آرشیو انجام نشد؛ اتصال را بررسی و صفحه را دوباره باز کنید.")).finally(()=>setLoading(false))},[]);
 const rows=useMemo(()=>items.filter(x=>(!featuredOnly||x.featured)&&`${x.title} ${x.address} ${x.district||""}`.includes(query.trim())).sort((a,b)=>sort==="cheap"?a.price-b.price:sort==="expensive"?b.price-a.price:sort==="oldest"?new Date(a.createdAt||0).getTime()-new Date(b.createdAt||0).getTime():new Date(b.createdAt||0).getTime()-new Date(a.createdAt||0).getTime()),[items,query,featuredOnly,sort]);
 const toggle=async(id:string)=>{try{const removing=favorites.includes(id),response=await fetch(removing?`/api/favorites?propertyId=${encodeURIComponent(id)}`:"/api/favorites",removing?{method:"DELETE"}:{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({propertyId:id})});if(response.status===401)return location.assign(`/login/user?returnTo=${encodeURIComponent(location.pathname)}`);if(response.ok)setFavorites(v=>removing?v.filter(x=>x!==id):[...v,id]);else setMessage("ذخیره علاقه‌مندی انجام نشد.")}catch{setMessage("ارتباط برقرار نشد؛ دوباره تلاش کنید.")}};
 return <SiteShell title={featuredOnly?"فایل‌های ویژه":"آرشیو املاک"} description={featuredOnly?"گزیده فایل‌های تأییدشده و ممتاز حاتم":"فایل‌های منتشرشده را جست‌وجو و با هم مقایسه کنید."}>
  <div className="site-search-bar"><MagnifyingGlassIcon/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جست‌وجو بر اساس عنوان، محله یا منطقه…"/></div>
  <div className="site-property-sort" role="group" aria-label="مرتب‌سازی املاک">{sortOptions.map(([value,label])=><button key={value} type="button" className={sort===value?"active":""} aria-pressed={sort===value} onClick={()=>setSort(value)}>{label}</button>)}</div>
  {mapEnabled&&<div className="site-map-toolbar"><button onClick={()=>setMapOpen(v=>!v)}>{mapOpen?"بستن نقشه":"نمایش روی نقشه"}</button><span>{rows.filter(p=>validCoordinates(p.latitude,p.longitude)).length.toLocaleString("fa-IR")} ملک با موقعیت ثبت‌شده</span></div>}
  <div>
  {mapOpen&&mapEnabled?<PropertyMapExplorer items={rows} onOpen={id=>location.assign(`/property/${encodeURIComponent(id)}`)}/>:<>
  {loading?<div className="site-empty">در حال دریافت فایل‌ها…</div>:<div className="site-property-grid">{rows.map(p=><article key={p.id}><Link href={`/property/${p.id}`} className="site-property-image"><img src={p.coverImage||"/assets/hatam/luxury-living.webp"} alt={p.title}/>{p.featured&&<b>ویژه</b>}</Link><div><div className="site-property-title"><Link href={`/property/${p.id}`}>{p.title}</Link><button onClick={()=>toggle(p.id)} aria-label="علاقه‌مندی">{favorites.includes(p.id)?<HeartFilledIcon/>:<HeartIcon/>}</button></div><p><DrawingPinIcon/>{p.address}</p><small>{p.area.toLocaleString("fa-IR",{useGrouping:false})} متر · {p.bedrooms.toLocaleString("fa-IR",{useGrouping:false})} خواب</small><strong>{p.price.toLocaleString("fa-IR")} تومان</strong></div></article>)}</div>}
  </>}</div>
  {!loading&&!rows.length&&<div className="site-empty">فایل منطبق و منتشرشده‌ای پیدا نشد.</div>}{message&&<div className="site-toast">{message}</div>}
 </SiteShell>
}
