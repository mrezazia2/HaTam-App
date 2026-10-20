"use client";
import {useEffect,useState} from 'react';
import {propertyFilterQuery,type PropertyFilters} from './property-filters';
import AppPropertyRows,{type AppPropertyRow} from './AppPropertyRows';
import './app-property-pages.css';
export default function FeaturedProperties({filters,onFilter,onClear}:{filters?:PropertyFilters;onFilter:()=>void;onClear:()=>void}){
 const query=filters?propertyFilterQuery(filters):new URLSearchParams();query.set('featured','1');const queryKey=query.toString();
 const [result,setResult]=useState<{key:string;items:AppPropertyRow[];error:string}|null>(null);
 const loading=result?.key!==queryKey,items=loading?[]:result?.items||[],error=loading?'':result?.error||'';
 useEffect(()=>{const controller=new AbortController();fetch('/api/properties?'+queryKey,{signal:controller.signal,cache:'no-store'}).then(async r=>{if(!r.ok)throw Error();const data=await r.json();setResult({key:queryKey,items:data.items||[],error:''})}).catch(()=>{if(!controller.signal.aborted)setResult({key:queryKey,items:[],error:'دریافت فایل‌های ویژه انجام نشد؛ دوباره تلاش کنید.'})});return()=>controller.abort()},[queryKey]);
 return <main className="app-designed-page app-featured-page" dir="rtl"><header><span>منتخب‌های حاتم</span><h1>فایل‌های ویژه</h1><p>ملک‌های منتشرشده‌ای که حاتم به‌عنوان فایل ویژه معرفی کرده است.</p></header><div className="featured-list-status"><span>{loading?'در حال دریافت…':items.length.toLocaleString('fa-IR')+' فایل ویژه'}</span><button type="button" onClick={onFilter}>فیلتر</button>{filters&&<button type="button" onClick={onClear}>پاک کردن فیلترها</button>}</div>{error&&<p role="alert">{error}</p>}<AppPropertyRows items={items}/>{!loading&&!error&&!items.length&&<div className="app-page-empty">فایل ویژه‌ای با این شرایط پیدا نشد.</div>}</main>
}
