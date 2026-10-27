"use client";
import BulkSelection,{SelectionCheckbox,useBulkSelection} from "../components/BulkSelection";
import {useEffect,useState} from "react";
type Item={id:string;title:string;description:string;status:string;createdAt?:string|number;district?:string|null};
export default function ConsultantRequests(){
 const archive=useArchiveFilter();const selection=useBulkSelection();const [items,setItems]=useState<Item[]>([]),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 const load=()=>{setLoading(true);fetch("/api/consultant/workspace",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{setItems(d.requests||[]);setError("")}).catch(()=>setError("دریافت درخواست‌ها انجام نشد.")).finally(()=>setLoading(false))};
 useEffect(()=>{queueMicrotask(load)},[]);
 const rows=items.filter(archive.matches);
 return <section className="portal-module"><ArchiveFilters filter={archive} items={items}/><BulkSelection ids={rows.map(x=>x.id)} selection={selection} actions={[]} run={async()=>{}} exportRows={rows}/><div className="portal-module-card"><h2>درخواست‌های ارجاع‌شده به شما</h2>{loading?<p>در حال دریافت…</p>:error?<div role="alert">{error}<button onClick={load}>تلاش دوباره</button></div>:rows.length?rows.map(item=><article key={item.id} style={{padding:16,borderBottom:"1px solid var(--theme-border)"}}><label className="archive-selection-label"><SelectionCheckbox id={item.id} label={item.title} selection={selection}/><h3>{item.title}</h3></label><p>{item.description}</p><small>{item.district} · {({new:"جدید",contacted:"تماس گرفته‌شده",matched:"ملک پیشنهادشده",closed:"بسته‌شده"} as Record<string,string>)[item.status]||item.status}</small></article>):<p>هنوز درخواستی به شما ارجاع نشده است.</p>}</div></section>;
}
import ArchiveFilters,{useArchiveFilter} from "../components/ArchiveFilters";
