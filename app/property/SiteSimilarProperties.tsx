"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
type Item={id:string;title:string;address:string;price:number;coverImage?:string|null;transactionType:string};
export default function SiteSimilarProperties({id,transactionType}:{id:string;transactionType:string}){
 const [items,setItems]=useState<Item[]>([]);
 useEffect(()=>{const c=new AbortController();fetch("/api/properties",{signal:c.signal,cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>setItems((d?.items||[]).filter((x:Item)=>x.id!==id&&x.transactionType===transactionType).slice(0,6))).catch(()=>{});return()=>c.abort()},[id,transactionType]);
 return <section style={{maxWidth:1180,margin:"24px auto",padding:16}}><h2>املاک مشابه</h2><div className="site-property-grid">{items.map(item=><article key={item.id}><Link href={"/property/"+encodeURIComponent(item.id)} className="site-property-image"><img src={item.coverImage||"/assets/hatam/luxury-living.webp"} alt={item.title}/></Link><div><Link href={"/property/"+encodeURIComponent(item.id)}>{item.title}</Link><p>{item.address}</p><strong>{item.price.toLocaleString("fa-IR")} تومان</strong></div></article>)}</div>{!items.length&&<p>ملک مشابهی موجود نیست.</p>}</section>;
}
