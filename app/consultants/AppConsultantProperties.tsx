"use client";
import {useEffect,useState} from 'react';
type Row={id:string;title:string;address:string;area:number;bedrooms:number;price:number;coverImage:string|null};
export default function AppConsultantProperties(){
 const [items,setItems]=useState<Row[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{const controller=new AbortController(),id=new URLSearchParams(location.search).get('consultantId');const load=async()=>{if(!id)throw Error('مشاور مشخص نشده است.');return fetch(`/api/properties?consultantId=${encodeURIComponent(id)}`,{signal:controller.signal,cache:'no-store'})};load().then(async r=>{if(!r.ok)throw Error();const d=await r.json();setItems(d.items||[])}).catch(()=>{if(!controller.signal.aborted)setError('دریافت فایل‌های مشاور انجام نشد.')}).finally(()=>setLoading(false));return()=>controller.abort()},[]);
 return <main className="consultant-directory in-app app-consultant-properties" dir="rtl"><h1>فایل‌های مشاور</h1>{loading&&<p role="status">در حال دریافت…</p>}{error&&<p role="alert">{error}</p>}<div className="consultant-property-results">{items.map(item=><a href={`/app?screen=detail&propertyId=${encodeURIComponent(item.id)}`} key={item.id}><img src={item.coverImage||'/assets/hatam/property-1.webp'} alt=""/><h2>{item.title}</h2><p>{item.address}</p><span>{item.area.toLocaleString('fa-IR')} متر · {item.bedrooms.toLocaleString('fa-IR')} خواب</span><strong>{item.price.toLocaleString('fa-IR')} تومان</strong></a>)}</div>{!loading&&!error&&!items.length&&<p>این مشاور هنوز ملک منتشرشده ندارد.</p>}</main>
}
