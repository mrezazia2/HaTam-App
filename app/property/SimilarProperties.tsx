"use client";
import {useEffect,useState} from 'react';
import AppPropertyRows,{type AppPropertyRow} from '../mobile/AppPropertyRows';
import '../mobile/app-property-pages.css';
import {rankSimilarProperties} from './similar-ranking';
export default function SimilarProperties({current}:{current:Pick<AppPropertyRow,'id'|'district'|'area'|'price'|'bedrooms'|'transactionType'>}){
 const [result,setResult]=useState<{key:string;items:AppPropertyRow[];error:string}|null>(null);
 const {id,district,area,price,bedrooms,transactionType}=current;
 const key=JSON.stringify(current),loading=result?.key!==key,items=loading?[]:result?.items||[],error=loading?'':result?.error||'';
 useEffect(()=>{const controller=new AbortController();fetch('/api/properties',{signal:controller.signal,cache:'no-store'}).then(async r=>{if(!r.ok)throw Error();const data=await r.json();setResult({key,items:rankSimilarProperties(data.items||[],{id,district,area,price,bedrooms,transactionType}),error:''})}).catch(()=>{if(!controller.signal.aborted)setResult({key,items:[],error:'دریافت املاک مشابه انجام نشد.'})});return()=>controller.abort()},[id,district,area,price,bedrooms,transactionType,key]);
 return <section className="app-similar-properties" aria-label="املاک مشابه"><h2>املاک مشابه</h2><p>پیشنهادها بر اساس محدوده، متراژ، قیمت و تعداد خواب هستند.</p>{loading&&<p role="status">در حال دریافت…</p>}{error&&<p role="alert">{error}</p>}<AppPropertyRows items={items}/>{!loading&&!error&&!items.length&&<p>ملک مشابه منتشرشده‌ای موجود نیست.</p>}</section>
}
