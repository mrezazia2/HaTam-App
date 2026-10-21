"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";

type Video={id:string;title:string;url:string};
export default function TrustExperience({onBack,onSell,onBuy,embedded=false}:{onBack?:()=>void;onSell?:()=>void;onBuy?:()=>void;embedded?:boolean}){
 const [videos,setVideos]=useState<Video[]>([]),[active,setActive]=useState(0);const rail=useRef<HTMLDivElement>(null);
 useEffect(()=>{let alive=true;const load=()=>fetch("/api/trust-videos",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{if(alive){setVideos(d.items||[]);setActive(index=>Math.max(0,Math.min(index,(d.items||[]).length-1)))}}).catch(()=>{});void load();const visible=()=>{if(document.visibilityState==="visible")void load()};document.addEventListener("visibilitychange",visible);window.addEventListener("focus",visible);const timer=window.setInterval(visible,30000);return()=>{alive=false;window.clearInterval(timer);document.removeEventListener("visibilitychange",visible);window.removeEventListener("focus",visible)}},[]);
 const move=(next:number)=>{if(!videos.length)return;const index=(next+videos.length)%videos.length;setActive(index);rail.current?.children[index]?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"})};
 return <main className={`trust-page${embedded?" trust-page-embedded":""}`} dir="rtl"><section className="trust-shell">
  {!embedded&&<header>{onBack?<button onClick={onBack} aria-label="بازگشت به اپ">‹</button>:<Link href="/app" aria-label="بازگشت به اپ">‹</Link>}<div><span>املاک حاتم</span><h1>اعتماد شما</h1></div><i>♥</i></header>}
  {embedded&&<h1 className="trust-embedded-title">اعتماد شما</h1>}
  <section className="trust-testimonials"><p>گوشه‌ی کوچکی از لطف و محبت شما:</p>
   {videos.length?<><div className="trust-video-rail" ref={rail}>{videos.map((video,index)=><article key={video.id} className={active===index?"active":""}><video controls playsInline preload="metadata" src={video.url}/><strong>{video.title}</strong></article>)}</div><div className="trust-slider-controls"><button onClick={()=>move(active+1)} aria-label="ویدیوی بعدی">‹</button><span>{videos.map((video,index)=><button key={video.id} className={active===index?"active":""} onClick={()=>move(index)} aria-label={`نمایش ویدیوی ${index+1}`}/>)}</span><button onClick={()=>move(active-1)} aria-label="ویدیوی قبلی">›</button></div></>:<div className="trust-empty"><b>♥</b><span>ویدیوهای رضایت مشتریان به‌زودی در این بخش قرار می‌گیرند.</span></div>}
  </section>
  <section className="trust-invite"><p>اگر در شرق تهران قصد خرید و یا فروش واحد داری، درخواستت رو ثبت کن :) کارشناسان ما خیلی سریع با شما تماس می‌گیرن:</p><div>{onSell?<button className="sell" onClick={onSell}>می‌خوام ملکم رو بفروشم <span>←</span></button>:<Link className="sell" href="/app?screen=urgent&source=trust">می‌خوام ملکم رو بفروشم <span>←</span></Link>}{onBuy?<button onClick={onBuy}>می‌خوام ملک بخرم <span>←</span></button>:<Link href="/app?screen=filter&mode=manual">می‌خوام ملک بخرم <span>←</span></Link>}</div></section>
 </section></main>
}
