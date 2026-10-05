"use client";

import { ChangeEvent, useState } from "react";
import { CheckIcon, ResetIcon, UploadIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useBrand } from "../brand/BrandProvider";
import AppearanceEditor from "./AppearanceEditor";
import "./appearance-editor.css";
import {useTheme} from "../theme/ThemeProvider";
import {MoonIcon,SunIcon} from "@radix-ui/react-icons";

async function uploadImage(event: ChangeEvent<HTMLInputElement>, kind:"logo"|"favicon", onRead: (value: string) => void) {
  const file = event.target.files?.[0];
  if (!file) return;
  const form=new FormData();form.set("file",file);form.set("kind",kind);
  const response=await fetch("/api/brand-assets",{method:"POST",body:form});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.error==="INVALID_IMAGE"?"فرمت PNG، JPG، WebP یا ICO با حداکثر ۳ مگابایت مجاز است.":"بارگذاری تصویر روی سرور انجام نشد.");
  onRead(result.url);
}

export default function AdminBrandSettings() {
  const { draft, setDraft, save, reset } = useBrand();
  const {theme,toggleTheme}=useTheme();
  const [message, setMessage] = useState("");
  const update = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const notify = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2600);
  };

  return <main className="admin-page" dir="rtl">
    <aside className="admin-sidebar">
      <img src={draft.logoUrl} alt={draft.brandName} />
      <div><strong>مدیریت حاتم</strong><span>مرکز هویت و ظاهر</span></div>
      <nav aria-label="ناوبری ادمین"><a className="active" href="#identity">هویت برند</a><a href="#colors">رنگ و تایپوگرافی</a><a href="#appearance">ظاهر مستقل رابط‌ها</a><a href="#previews">پیش‌نمایش‌ها</a></nav>
      <Link className="admin-back" href="/">بازگشت به سایت</Link>
    </aside>

    <section className="admin-content">
      <header className="admin-header">
        <div><span>تنظیمات مرکزی</span><h1>هویت بصری املاک حاتم</h1><p>اطلاعات برند مشترک است؛ چیدمان سایت و اپ مستقل باقی می‌ماند.</p></div>
        <div className="admin-actions"><button type="button" className="admin-theme-button" onClick={toggleTheme} aria-label={theme==="dark"?"فعال‌کردن حالت روشن":"فعال‌کردن حالت تیره"} title={theme==="dark"?"حالت روشن":"حالت تیره"}>{theme==="dark"?<SunIcon/>:<MoonIcon/>}</button><button className="secondary" onClick={() => { reset().then(()=>notify("تنظیمات پیش‌فرض حاتم بازیابی شد.")).catch(error=>notify(error.message)); }}><ResetIcon /> بازنشانی</button><button className="primary" onClick={() => { save().then(()=>notify("تنظیمات برند در پایگاه داده مرکزی ذخیره شد.")).catch(error=>notify(error.message)); }}><CheckIcon /> ذخیره تنظیمات</button></div>
      </header>

      <div className="admin-layout">
        <div className="admin-forms">
          <section className="settings-card" id="identity">
            <div className="settings-heading"><span>01</span><div><h2>نام و نشان برند</h2><p>اطلاعات مشترک سایت، اپ و پنل‌ها.</p></div></div>
            <div className="field-grid"><label><span>نام سایت و برند</span><input value={draft.brandName} onChange={(e) => update("brandName", e.target.value)} /></label><label><span>شعار رسمی</span><input value={draft.slogan} onChange={(e) => update("slogan", e.target.value)} /></label></div>
            <div className="asset-grid">
              <AssetControl title="لوگوی اصلی" hint="PNG، JPG یا WebP؛ حداکثر ۳ مگابایت" value={draft.logoUrl} onChange={(value) => update("logoUrl", value)} onError={notify} />
              <AssetControl title="فاوآیکن" hint="PNG یا ICO مربع؛ حداکثر ۳ مگابایت" value={draft.faviconUrl} favicon onChange={(value) => update("faviconUrl", value)} onError={notify} />
            </div>
          </section>

          <section className="settings-card" id="colors">
            <div className="settings-heading"><span>02</span><div><h2>رنگ و تایپوگرافی</h2><p>توکن‌های مشترک برند بدون ادغام ساختار محصولات.</p></div></div>
            <div className="color-grid">{([['primaryColor','رنگ اصلی'],['secondaryColor','رنگ مکمل'],['accentColor','رنگ طلایی']] as const).map(([key,label]) => <label key={key}><span>{label}</span><div><input type="color" value={draft[key]} onChange={(e) => update(key,e.target.value)} /><input value={draft[key]} onChange={(e) => update(key,e.target.value)} /></div></label>)}</div>
            <div className="field-grid type-fields"><label><span>خانواده فونت فارسی</span><select value={draft.fontFamily} onChange={(e) => update("fontFamily",e.target.value)}><option value="Vazirmatn">وزیرمتن</option><option value="Tahoma">Tahoma</option><option value="Arial">Arial</option></select></label><label><span>مقیاس تایپوگرافی: {draft.typeScale.toFixed(2)}×</span><input type="range" min="0.9" max="1.15" step="0.05" value={draft.typeScale} onChange={(e) => update("typeScale",Number(e.target.value))} /></label></div>
          </section>
          <AppearanceEditor/>
        </div>

        <aside className="preview-column" id="previews">
          <div className="preview-heading"><span>پیش‌نمایش زنده</span><small>سایت و اپ مستقل</small></div>
          <article className="site-preview" style={{backgroundColor:draft.secondaryColor}}><img className="preview-bg" src="/assets/hatam/tehran-night-hero.webp" alt="نمای شب تهران" /><div className="preview-overlay" /><header><img src={draft.logoUrl} alt="" /><span>وب‌سایت عمومی</span></header><div className="preview-copy"><small>{draft.brandName}</small><h3>{draft.slogan}</h3><p>جست‌وجوی هوشمند ملک در تهران</p><button style={{backgroundColor:draft.primaryColor,color:draft.accentColor}}>جست‌وجوی هوشمند</button></div></article>
          <article className="app-preview" style={{background:`linear-gradient(160deg, ${draft.secondaryColor}, ${draft.primaryColor})`}}><div className="app-preview-top"><span>9:41</span><img src={draft.logoUrl} alt="" /></div><p>سلام حاتم</p><small>{draft.slogan}</small><div className="app-search">جست‌وجو در محله، منطقه یا خیابان...</div><div className="app-preview-cards"><i /><i /><i /><i /></div><div className="app-preview-property"><img src="/assets/hatam/luxury-living.webp" alt="" /><div><strong>آپارتمان نوساز نیاوران</strong><span>۱۲.۵ میلیارد تومان</span></div></div></article>
          <p className="storage-note">تنظیمات از API مرکزی خوانده می‌شوند و در تمام رابط‌ها مشترک هستند.</p>
        </aside>
      </div>
    </section>
    {message && <div className="admin-toast" role="status">{message}</div>}
  </main>;
}

function AssetControl({ title, hint, value, favicon = false, onChange,onError }: { title:string; hint:string; value:string; favicon?:boolean; onChange:(value:string)=>void;onError:(message:string)=>void }) {
  const [uploading,setUploading]=useState(false);
  return <div className="asset-control"><div className={`asset-preview ${favicon ? "favicon" : "logo"}`}><img src={value} alt={`پیش‌نمایش ${title}`} /></div><div><strong>{title}</strong><small>{hint}</small><label className="upload-button"><UploadIcon /> {uploading?"در حال بارگذاری…":"انتخاب فایل"}<input type="file" disabled={uploading} accept=".png,.jpg,.jpeg,.webp,.ico" onChange={(event)=>{setUploading(true);uploadImage(event,favicon?"favicon":"logo",onChange).catch(error=>onError(error.message)).finally(()=>setUploading(false))}} /></label></div></div>;
}
