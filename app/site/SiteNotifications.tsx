"use client";
import Link from "next/link";
import {useCallback,useEffect,useState} from "react";
import {BellIcon,CheckIcon} from "@radix-ui/react-icons";
import SiteShell from "./SiteShell";
import "./site-interactions.css";
type Notice={id:string;title:string;body:string;createdAt:string;readAt:string|null;link?:string|null};
export default function SiteNotifications(){
 const [items,setItems]=useState<Notice[]>([]),[auth,setAuth]=useState(true),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[unread,setUnread]=useState(0),[error,setError]=useState("");
 const load=useCallback(async()=>{try{const response=await fetch("/api/notifications",{cache:"no-store"});if(response.status===401){setAuth(false);return}if(!response.ok)throw Error();const body=await response.json();setItems(body.items||[]);setUnread(body.unread||0);setError("")}catch{setError("دریافت اعلان‌ها انجام نشد؛ دوباره تلاش کنید.")}finally{setLoading(false)}},[]);
 useEffect(()=>{queueMicrotask(()=>void load());const events=new EventSource("/api/notifications/stream");events.addEventListener("notification",()=>void load());const timer=setInterval(()=>void load(),30000);return()=>{events.close();clearInterval(timer)}},[load]);
 const read=async(item?:Notice)=>{setBusy(true);try{const response=await fetch("/api/notifications",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(item?{id:item.id}:{all:true})});if(!response.ok)throw Error();await load();window.dispatchEvent(new Event("hatam:notifications-read"));if(item?.link&&item.link.startsWith("/")&&!item.link.startsWith("//"))location.assign(item.link)}catch{setError("ثبت خواندن اعلان انجام نشد؛ دوباره تلاش کنید.")}finally{setBusy(false)}};
 return <SiteShell title="اعلان‌های سایت" description="آخرین وضعیت درخواست‌ها و پیام‌های حساب شما.">
  {!auth?<div className="site-empty"><Link href="/login/user?returnTo=%2Fnotifications">برای مشاهدهٔ اعلان‌ها وارد حساب شوید</Link></div>:<>
   <div className="site-notice-toolbar"><span>{unread.toLocaleString("fa-IR")} اعلان خوانده‌نشده</span><button type="button" disabled={busy||!unread} onClick={()=>void read()}><CheckIcon/>خواندن همه</button></div>
   {error&&<div className="site-notice-error" role="alert">{error}<button onClick={()=>void load()}>تلاش دوباره</button></div>}
   <div className="site-notice-list">{items.map(item=><button type="button" disabled={busy} key={item.id} className={item.readAt?"":"unread"} onClick={()=>void read(item)}><span className="site-notice-symbol"><BellIcon/></span><span className="site-notice-copy"><strong>{item.title}</strong><span>{item.body}</span><time>{new Date(item.createdAt).toLocaleString("fa-IR")}</time></span>{!item.readAt&&<i className="notice-unread-dot" aria-label="خوانده‌نشده"/>}</button>)}</div>
   {loading?<div className="site-empty">در حال دریافت اعلان‌ها…</div>:!items.length&&!error&&<div className="site-empty"><BellIcon/>اعلانی ندارید.</div>}
  </>}
 </SiteShell>;
}
