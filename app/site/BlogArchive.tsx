"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FileTextIcon } from "@radix-ui/react-icons";
import SiteShell from "./SiteShell";
export default function BlogArchive(){const [items,setItems]=useState<any[]>([]);useEffect(()=>{fetch("/api/content").then(r=>r.json()).then(d=>setItems((d.items||[]).filter((x:any)=>x.slug!=="contact")))},[]);return <SiteShell title="مجله املاک حاتم" description="راهنمای کاربردی خرید، فروش و سرمایه‌گذاری در بازار املاک شرق تهران."><div className="site-blog-grid">{items.map(x=><Link href={`/content/${x.slug}`} key={x.id}><FileTextIcon/><span>راهنمای املاک</span><h2>{x.title}</h2><p>{x.seoDescription||"مطالب تخصصی تیم حاتم برای تصمیم‌گیری مطمئن‌تر."}</p><b>مطالعه مطلب ←</b></Link>)}{!items.length&&<div className="site-empty">نخستین مطالب مجله از صفحه‌ساز پنل ادمین منتشر می‌شوند.</div>}</div></SiteShell>}
