"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import type { ContentPage } from "../../admin/AdminWorkspace";
import { useBrand } from "../../brand/BrandProvider";

export default function ContentRenderer({slug}:{slug:string}){const {settings}=useBrand();const [page,setPage]=useState<ContentPage|null>(null),[loading,setLoading]=useState(true);useEffect(()=>{setLoading(true);fetch(`/api/content/${encodeURIComponent(slug)}`,{cache:"no-store"}).then(response=>response.ok?response.json():Promise.reject()).then(data=>setPage(data.page||null)).catch(()=>setPage(null)).finally(()=>setLoading(false))},[slug]);if(loading)return <main className="published-empty" dir="rtl"><img src={settings.logoUrl} alt={settings.brandName}/><h1>در حال دریافت صفحه…</h1></main>;if(!page)return <main className="published-empty" dir="rtl"><img src={settings.logoUrl} alt={settings.brandName}/><h1>این صفحه هنوز منتشر نشده است</h1><p>محتوای این صفحه پس از انتشار در دسترس قرار می‌گیرد.</p><Link href="/">بازگشت به صفحه اصلی</Link></main>;return <main className={`published-page published-${page.target}`} dir="rtl"><header><Link href="/"><img src={settings.logoUrl} alt={settings.brandName}/></Link><span>{page.target==="site"?"وب‌سایت املاک حاتم":"اپ حاتم"}</span></header><article>{page.blocks.map(block=><section className={`published-${block.type}`} key={block.id}><h1>{block.title}</h1>{block.type==="features"?<div>{block.body.split("|").map(item=><span key={item}><CheckCircledIcon/>{item}</span>)}</div>:<p>{block.body}</p>}{block.type==="cta"&&<Link href="/login/user">شروع کنید</Link>}</section>)}</article></main>}
