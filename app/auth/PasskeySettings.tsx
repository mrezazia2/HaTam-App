"use client";
import {useCallback,useEffect,useState} from "react";
import {enrollPasskey,passkeyMessage,passkeySupported} from "./passkeys-client";

type Item={id:string;label:string;createdAt:string|number;lastUsedAt:string|number|null};
export default function PasskeySettings(){
 const [items,setItems]=useState<Item[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[available,setAvailable]=useState(false);
 const load=useCallback(async()=>{try{const response=await fetch("/api/auth/passkeys",{cache:"no-store"});if(!response.ok)return;const body=await response.json();setItems(body.items||[]);setAvailable(true)}catch{}},[]);
 useEffect(()=>{void load()},[load]);
 if(!available)return null;
 const add=async()=>{setBusy(true);setMessage("");try{await enrollPasskey();setMessage("قفل دستگاه با موفقیت برای ورود فعال شد.");await load()}catch(error){setMessage(passkeyMessage(error))}finally{setBusy(false)}};
 const remove=async(id:string)=>{if(!window.confirm("این کلید عبور حذف شود؟ ورود با آن دستگاه دیگر ممکن نخواهد بود."))return;setBusy(true);setMessage("");try{const response=await fetch("/api/auth/passkeys",{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({id})});if(!response.ok)throw new Error();setMessage("کلید عبور حذف شد.");await load()}catch{setMessage("حذف کلید عبور انجام نشد.")}finally{setBusy(false)}};
 return <section className="passkey-settings" dir="rtl"><h3>ورود با قفل دستگاه</h3><p>در گوشی یا مرورگر پشتیبانی‌شده، با اثرانگشت، تشخیص چهره، PIN یا الگوی خود دستگاه وارد شوید. حاتم فقط کلید عمومی را نگه می‌دارد و به دادهٔ بیومتریک دسترسی ندارد.</p><button disabled={busy||!passkeySupported()||items.length>=5} onClick={add}>{busy?"لطفاً صبر کنید...":"فعال‌کردن روی این دستگاه"}</button>{!passkeySupported()&&<p>این مرورگر یا اتصال از کلید عبور پشتیبانی نمی‌کند؛ ورود پیامکی و رمز عبور همچنان فعال‌اند.</p>}{items.length>0&&<ul>{items.map(item=><li key={item.id}><span><strong>{item.label}</strong><small>ثبت‌شده در {new Date(item.createdAt).toLocaleDateString("fa-IR")}{item.lastUsedAt?` · آخرین استفاده ${new Date(item.lastUsedAt).toLocaleDateString("fa-IR")}`:""}</small></span><button disabled={busy} onClick={()=>remove(item.id)}>حذف دسترسی</button></li>)}</ul>}{message&&<p role="status">{message}</p>}</section>;
}
