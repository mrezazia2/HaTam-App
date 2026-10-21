"use client";
import {useCallback,useEffect,useState} from "react";
import {uploadPropertyFile} from '../../components/upload-property-media';
import type {UploadProgress} from '../../components/upload-progress';
type Item={id:string;title:string;url:string;enabled:boolean;sortOrder:number;size:number};
type UploadSettings={videoMaxMb:number;allowedExtensions:string[]};
const videoFormats=["mp4","webm","mov"];
function uploadError(error:string,maxMb:number){
  switch(error){
    case "FILE_TOO_LARGE":return `حجم ویدیو از سقف ${maxMb} مگابایت بیشتر است.`;
    case "FILE_TYPE_NOT_ALLOWED":return "فرمت این ویدیو در تنظیمات آپلود ادمین مجاز نیست.";
    case "FILE_TYPE_MISMATCH":return "نوع فایل با پسوند ویدیو سازگار نیست.";
    case "VIDEO_ONLY":return "فقط فایل ویدیویی قابل بارگذاری است.";
    case "MEDIA_STORAGE_UNAVAILABLE":return "فضای ذخیره‌سازی رسانه روی سرور در دسترس نیست.";
    case "UPLOAD_STORAGE_FAILED":return "ذخیره ویدیو روی سرور انجام نشد؛ وضعیت فضای رسانه را بررسی کنید.";
    default:return "بارگذاری انجام نشد. اتصال یا نشست مدیریت را بررسی کنید.";
  }
}
export default function TrustVideoAdmin(){
  const [progress,setProgress]=useState<UploadProgress>({percent:0,state:"staged"});
  const [items,setItems]=useState<Item[]>([]),[title,setTitle]=useState(""),[file,setFile]=useState<File|null>(null),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[settings,setSettings]=useState<UploadSettings>({videoMaxMb:100,allowedExtensions:["mp4","webm","mov"]});
  const load=useCallback(async()=>{try{const response=await fetch("/api/admin/trust-videos",{cache:"no-store"});if(!response.ok)throw new Error();const data=await response.json();setItems(data.items||[])}catch{setNotice("دریافت ویدیوها انجام نشد.")}},[]);
  useEffect(()=>{void load();fetch("/api/admin/upload-settings",{cache:"no-store"}).then(response=>response.ok?response.json():null).then(data=>data?.settings&&setSettings(data.settings)).catch(()=>{})},[load]);
  const allowed=videoFormats.filter(extension=>settings.allowedExtensions.includes(extension));
  const upload=async()=>{
    if(!file)return setNotice("یک فایل ویدیویی انتخاب کنید.");
    const extension=file.name.split(".").pop()?.toLowerCase()||"";
    if(!allowed.includes(extension))return setNotice("فرمت این فایل در تنظیمات آپلود مجاز نیست.");
    if(file.size>settings.videoMaxMb*1024*1024)return setNotice(`حجم ویدیو نباید از ${settings.videoMaxMb} مگابایت بیشتر باشد.`);
    setBusy(true);setNotice("");
    try{const data=new FormData();data.set("video",file);data.set("title",title||file.name);data.set("sortOrder",String(Math.max(0,...items.map(x=>x.sortOrder))+10));
      const media=await uploadPropertyFile(file,"admin",setProgress);const response=await fetch("/api/admin/trust-videos",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mediaKey:media.key,title:title||file.name,sortOrder:Math.max(0,...items.map(x=>x.sortOrder))+10})});
      const result=await response.json().catch(()=>({error:response.status===413?"FILE_TOO_LARGE":"UNKNOWN"}));
      if(!response.ok)throw new Error(uploadError(result.error,result.maxMb||settings.videoMaxMb));
      setNotice("ویدیو با موفقیت بارگذاری شد.");setFile(null);setTitle("");await load();
    }catch(error){setProgress(current=>({...current,state:"failed"}));setNotice(error instanceof Error?error.message:"بارگذاری انجام نشد.")}finally{setBusy(false)}
  };
  const update=async(item:Item,patch:Partial<Item>)=>{const response=await fetch("/api/admin/trust-videos",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({...item,...patch})});if(!response.ok)setNotice("ویرایش ویدیو انجام نشد.");await load()};
  const remove=async(item:Item)=>{if(!confirm(`ویدیوی «${item.title}» حذف شود؟`))return;const response=await fetch(`/api/admin/trust-videos?id=${encodeURIComponent(item.id)}`,{method:"DELETE"});setNotice(response.ok?"ویدیو حذف شد.":"حذف انجام نشد.");if(response.ok)await load()};
  return <><section className="trust-upload"><label><span>عنوان ویدیو</span><input value={title} onChange={event=>setTitle(event.target.value)} placeholder="مثلاً رضایت خانواده احمدی"/></label><label className="trust-file"><input type="file" accept={allowed.map(extension=>`.${extension}`).join(",")} onChange={event=>setFile(event.target.files?.[0]||null)}/><strong>{file?file.name:"انتخاب ویدیو"}</strong><small>{allowed.length?`${allowed.join("، ").toUpperCase()} تا ${settings.videoMaxMb} مگابایت`:"بارگذاری ویدیو در تنظیمات آپلود غیرفعال است."}</small></label><div className={`trust-upload-progress ${progress.state}`} role="status"><progress max="100" value={progress.percent}/>{progress.state==="complete"?"✓ آپلود کامل":progress.state==="failed"?"✕ ناموفق؛ برای ادامه دوباره بزنید":progress.percent.toLocaleString("fa-IR")+"٪"}</div><button disabled={busy||!allowed.length} onClick={upload}>{busy?"در حال بارگذاری…":"بارگذاری و افزودن به اسلایدر"}</button></section>{notice&&<p className="trust-admin-notice" role="status">{notice}</p>}<section className="trust-admin-list">{items.map((item,index)=><article key={item.id}><video src={item.url} controls playsInline preload="metadata"/><div><input value={item.title} onChange={event=>setItems(rows=>rows.map(row=>row.id===item.id?{...row,title:event.target.value}:row))} onBlur={()=>void update(item,{title:item.title})}/><small>{(item.size/1024/1024).toLocaleString("fa-IR",{maximumFractionDigits:1})} مگابایت</small></div><button disabled={!index} onClick={()=>void update(item,{sortOrder:items[index-1].sortOrder-1})}>↑</button><button aria-pressed={item.enabled} onClick={()=>void update(item,{enabled:!item.enabled})}>{item.enabled?"نمایش عمومی: روشن":"نمایش عمومی: خاموش"}</button><button className="danger" onClick={()=>void remove(item)}>حذف</button></article>)}{!items.length&&<div className="trust-admin-empty">هنوز ویدیویی بارگذاری نشده است.</div>}</section></>;
}
