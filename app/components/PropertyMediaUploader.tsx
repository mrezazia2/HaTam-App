"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Cross2Icon, ImageIcon, UploadIcon, VideoIcon } from "@radix-ui/react-icons";
import "./property-media-uploader.css";
import CircularUploadProgress from './CircularUploadProgress';
import type {UploadProgress} from './upload-progress';
import {uploadPropertyFile} from './upload-property-media';

export type PropertyMedia = { key: string; url: string; name: string; type: string; size: number; file?:File };
type UploadSettings = { imageMaxMb: number; videoMaxMb: number; maxPropertyFiles: number; allowedExtensions: string[] };
const fallback: UploadSettings = { imageMaxMb: 15, videoMaxMb: 100, maxPropertyFiles: 12, allowedExtensions: ["jpg", "jpeg", "png", "webp", "mp4", "webm", "mov", "m4v", "avi", "mkv"] };

export default function PropertyMediaUploader({ role, value, onChange,guest=false }: { role: "admin" | "user" | "consultant" | "agency"; value: PropertyMedia[]; onChange: (items: PropertyMedia[]) => void;guest?:boolean }) {
  const inFlight = useRef(false);const [queue,setQueue]=useState<{file:File;url:string;progress:UploadProgress}[]>([]);const [fileProgress,setFileProgress]=useState<Record<string,UploadProgress>>({});
 useEffect(()=>{const listener=(event:Event)=>{const d=(event as CustomEvent).detail;setFileProgress(current=>({...current,[d.file.name]:d}))};window.addEventListener("hatam:upload-progress",listener);return()=>window.removeEventListener("hatam:upload-progress",listener)},[]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(fallback);
  useEffect(() => { fetch("/api/upload-settings", { cache: "no-store" }).then(response => response.ok ? response.json() : Promise.reject()).then(body => setSettings({ ...fallback, ...body.settings })).catch(() => {}); }, []);
  const mediaExtensions = useMemo(() => settings.allowedExtensions.filter(extension => fallback.allowedExtensions.includes(extension)), [settings.allowedExtensions]);
  const upload = async (files: FileList | null) => {
    if (!files?.length || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    const created: PropertyMedia[] = [];
    try {
      const selected=Array.from(files).slice(0,settings.maxPropertyFiles-value.length);setQueue(current=>[...current,...selected.map(file=>({file,url:URL.createObjectURL(file),progress:{percent:0,state:"uploading" as const}}))]);
      for(let offset=0;offset<selected.length;offset+=2){
        const results=await Promise.allSettled(selected.slice(offset,offset+2).map(async file=>{
          const extension=file.name.split('.').pop()?.toLowerCase()||'';
          if(!mediaExtensions.includes(extension))throw Error('FILE_TYPE_NOT_ALLOWED');
          if(file.size>(file.type.startsWith('video/')?settings.videoMaxMb:settings.imageMaxMb)*1024*1024)throw Error('FILE_TOO_LARGE');
          if(guest){setQueue(current=>current.filter(item=>{if(item.file===file){URL.revokeObjectURL(item.url);return false}return true}));return {key:`local-${crypto.randomUUID()}`,url:URL.createObjectURL(file),name:file.name,type:file.type||(['mp4','webm','mov','m4v','avi','mkv'].includes(extension)?'video/mp4':'image/jpeg'),size:file.size,file};}
          const uploaded=await uploadPropertyFile(file,role,progress=>setQueue(current=>current.map(item=>item.file===file?{...item,progress}:item)));setQueue(current=>current.filter(item=>{if(item.file===file){URL.revokeObjectURL(item.url);return false}return true}));return uploaded;
        }));
        for(const result of results)if(result.status==='fulfilled')created.push(result.value);
        const failed=results.find(result=>result.status==='rejected');if(failed?.status==='rejected')throw failed.reason;
      }
    } catch (reason) {
      setQueue(current=>current.map(item=>item.progress.state==="uploading"?{...item,progress:{...item.progress,state:"failed"}}:item));
      const code = reason instanceof Error ? reason.message : "";
      setError(code === "MEDIA_STORAGE_UNAVAILABLE" ? "فضای ذخیره‌سازی سرور در دسترس نیست؛ مدیر سرور باید اتصال دیسک رسانه را بررسی کند." : code === "FILE_TOO_LARGE" ? "حجم فایل از محدودیت تعیین‌شده در تنظیمات بیشتر است." : code === "FILE_TYPE_NOT_ALLOWED" ? "فرمت این فایل در تنظیمات بارگذاری مجاز نشده است." : "بارگذاری برخی فایل‌ها انجام نشد؛ فایل‌های موفق حفظ شدند. اتصال را بررسی و دوباره تلاش کنید.");
    } finally {
      if (created.length) onChange([...value, ...created]);
      inFlight.current = false;
      setBusy(false);
    }
  };
  const remove = async (item: PropertyMedia) => {
    if(item.file){URL.revokeObjectURL(item.url);onChange(value.filter(entry=>entry.key!==item.key));return}
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/property-media?key=${encodeURIComponent(item.key)}`, { method: "DELETE", headers: { "x-hatam-preview-role": role } });
      if (!response.ok) throw new Error("DELETE_FAILED");
      onChange(value.filter(entry => entry.key !== item.key));
    } catch {
      setError("حذف فایل انجام نشد؛ دوباره تلاش کنید.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const makeCover = (item: PropertyMedia) => onChange([item, ...value.filter(entry => entry.key !== item.key)]);
  const coverKey = value.find(item => item.type.startsWith("image/"))?.key;
  return <section className="property-media-uploader" dir="rtl">
    {guest&&<p>فایل‌ها فعلاً روی همین دستگاه آماده می‌شوند؛ در ثبت نهایی، پس از تأیید شماره، به سرور ارسال می‌شوند. این صفحه را نبندید.</p>}
    <label><UploadIcon /><strong>{busy ? "در حال بارگذاری..." : "افزودن عکس و ویدیو ملک"}</strong><small>حداکثر {settings.maxPropertyFiles.toLocaleString("fa-IR")} فایل؛ تصویر تا {settings.imageMaxMb.toLocaleString("fa-IR")} و ویدیو تا {settings.videoMaxMb.toLocaleString("fa-IR")} مگابایت</small><input disabled={busy || value.length >= settings.maxPropertyFiles} type="file" accept={mediaExtensions.map(extension => `.${extension}`).join(",")} multiple onChange={event => { void upload(event.target.files); event.target.value = ""; }} /></label>
    {queue.length>0&&<div className="property-media-grid">{queue.map((item,index)=><article key={index}>{item.file.type.startsWith("video")?<video src={item.url} muted playsInline preload="metadata"/>:<img src={item.url} alt={item.file.name}/>}<button type="button" className="media-delete-button" disabled={busy} aria-label={`حذف ${item.file.name}`} onClick={()=>{URL.revokeObjectURL(item.url);setQueue(current=>current.filter(x=>x.file!==item.file))}}><Cross2Icon/></button><div className={`upload-file-state ${item.progress.state}`} role="status"><CircularUploadProgress {...item.progress}/>{item.progress.state==="failed"&&<button onClick={async()=>{try{const uploaded=await uploadPropertyFile(item.file,role,progress=>setQueue(current=>current.map(x=>x.file===item.file?{...x,progress}:x)));onChange([...value,uploaded]);setQueue(current=>current.filter(x=>x.file!==item.file))}catch{}}}>ادامه آپلود</button>}</div></article>)}</div>}
    {value.length > 0 && <div className="property-media-grid">{value.map(item => <article key={item.key}>
      {item.type.startsWith("video") ? <video src={item.url} controls preload="metadata" /> : <img src={item.url} alt={item.name} />}
      <div className={`upload-file-state ${item.file?(fileProgress[item.name]?.state||"staged"):"complete"}`} role="status"><CircularUploadProgress percent={item.file?(fileProgress[item.name]?.percent||0):100} state={item.file?(fileProgress[item.name]?.state||"staged"):"complete"}/></div><button className="media-delete-button" type="button" disabled={busy} onClick={() => remove(item)} aria-label={`حذف ${item.name}`}><Cross2Icon /></button>
      <span>{item.type.startsWith("video") ? <VideoIcon /> : <ImageIcon />}{item.key === coverKey ? <b>کاور</b> : item.type.startsWith("image/") && <button className="media-cover-button" type="button" onClick={() => makeCover(item)}>انتخاب کاور</button>}<small>{item.name}</small></span>
    </article>)}</div>}
    {error && <p>{error}</p>}
  </section>;
}
