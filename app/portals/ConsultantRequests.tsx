"use client";
import {useEffect,useState} from "react";
type Item={id:string;title:string;description:string;status:string;district?:string|null};
export default function ConsultantRequests(){
 const [items,setItems]=useState<Item[]>([]),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 const load=()=>{setLoading(true);fetch("/api/consultant/workspace",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{setItems(d.requests||[]);setError("")}).catch(()=>setError("دریافت درخواست‌ها انجام نشد.")).finally(()=>setLoading(false))};
 useEffect(()=>{queueMicrotask(load)},[]);
 return <section className="portal-module"><div className="portal-module-card"><h2>درخواست‌های ارجاع‌شده به شما</h2>{loading?<p>در حال دریافت…</p>:error?<div role="alert">{error}<button onClick={load}>تلاش دوباره</button></div>:items.length?items.map(item=><article key={item.id} style={{padding:16,borderBottom:"1px solid var(--theme-border)"}}><h3>{item.title}</h3><p>{item.description}</p><small>{item.district} · {({new:"جدید",contacted:"تماس گرفته‌شده",matched:"ملک پیشنهادشده",closed:"بسته‌شده"} as Record<string,string>)[item.status]||item.status}</small></article>):<p>هنوز درخواستی به شما ارجاع نشده است.</p>}</div></section>;
}
