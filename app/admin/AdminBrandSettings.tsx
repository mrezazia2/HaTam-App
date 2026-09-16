"use client";

import { ChangeEvent, useState } from "react";
import { CheckIcon, ResetIcon, UploadIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useBrand } from "../brand/BrandProvider";

function readImage(event: ChangeEvent<HTMLInputElement>, onRead: (value: string) => void) {
  const file = event.target.files?.[0];
  if (!file?.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => typeof reader.result === "string" && onRead(reader.result);
  reader.readAsDataURL(file);
}

export default function AdminBrandSettings() {
  const { draft, setDraft, save, reset } = useBrand();
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
      <nav aria-label="ناوبری ادمین"><a className="active" href="#identity">هویت برند</a><a href="#colors">رنگ و تایپوگرافی</a><a href="#previews">پیش‌نمایش‌ها</a></nav>
      <Link className="admin-back" href="/">بازگشت به سایت</Link>
    </aside>

    <section className="admin-content">
      <header className="admin-header">
        <div><span>تنظیمات مرکزی</span><h1>هویت بصری املاک حاتم</h1><p>اطلاعات برند مشترک است؛ چیدمان سایت و اپ مستقل باقی می‌ماند.</p></div>
        <div className="admin-actions"><button className="secondary" onClick={() => { reset(); notify("تنظیمات پیش‌فرض حاتم بازیابی شد."); }}><ResetIcon /> بازنشانی</button><button className="primary" onClick={() => { save(); notify("تنظیمات برند در پایگاه داده مرکزی ذخیره شد."); }}><CheckIcon /> ذخیره تنظیمات</button></div>
      </header>

      <div className="admin-layout">
        <div className="admin-forms">
          <section className="settings-card" id="identity">
            <div className="settings-heading"><span>01</span><div><h2>نام و نشان برند</h2><p>اطلاعات مشترک سایت، اپ و پنل‌ها.</p></div></div>
            <div className="field-grid"><label><span>نام سایت و برند</span><input value={draft.brandName} onChange={(e) => update("brandName", e.target.value)} /></label><label><span>شعار رسمی</span><input value={draft.slogan} onChange={(e) => update("slogan", e.target.value)} /></label></div>
            <div className="asset-grid">
              <AssetControl title="لوگوی اصلی" hint="PNG، JPG، WebP یا SVG" value={draft.logoUrl} onChange={(value) => update("logoUrl", value)} />
              <AssetControl title="فاوآیکن" hint="تصویر مربع و خوانا" value={draft.faviconUrl} favicon onChange={(value) => update("faviconUrl", value)} />
            </div>
          </section>

          <section className="settings-card" id="colors">
            <div className="settings-heading"><span>02</span><div><h2>رنگ و تایپوگرافی</h2><p>توکن‌های مشترک برند بدون ادغام ساختار محصولات.</p></div></div>
            <div className="color-grid">{([['primaryColor','رنگ اصلی'],['secondaryColor','رنگ مکمل'],['accentColor','رنگ طلایی']] as const).map(([key,label]) => <label key={key}><span>{label}</span><div><input type="color" value={draft[key]} onChange={(e) => update(key,e.target.value)} /><input value={draft[key]} onChange={(e) => update(key,e.target.value)} /></div></label>)}</div>
            <div className="field-grid type-fields"><label><span>خانواده فونت فارسی</span><select value={draft.fontFamily} onChange={(e) => update("fontFamily",e.target.value)}><option value="Vazirmatn">وزیرمتن</option><option value="Tahoma">Tahoma</option><option value="Arial">Arial</option></select></label><label><span>مقیاس تایپوگرافی: {draft.typeScale.toFixed(2)}×</span><input type="range" min="0.9" max="1.15" step="0.05" value={draft.typeScale} onChange={(e) => update("typeScale",Number(e.target.value))} /></label></div>
          </section>
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

function AssetControl({ title, hint, value, favicon = false, onChange }: { title:string; hint:string; value:string; favicon?:boolean; onChange:(value:string)=>void }) {
  return <div className="asset-control"><div className={`asset-preview ${favicon ? "favicon" : "logo"}`}><img src={value} alt={`پیش‌نمایش ${title}`} /></div><div><strong>{title}</strong><small>{hint}</small><label className="upload-button"><UploadIcon /> انتخاب فایل<input type="file" accept="image/*" onChange={(e) => readImage(e,onChange)} /></label></div></div>;
}
