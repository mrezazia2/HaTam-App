"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircledIcon,
  ColorWheelIcon,
  DashboardIcon,
  FontStyleIcon,
  GearIcon,
  ImageIcon,
  MobileIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { BrandLogo } from "./BrandTheme";
import { BrandSettings, defaultBrandSettings, readBrandSettings, saveBrandSettings } from "./brand-settings";

type AssetField = "logoUrl" | "faviconUrl";

const colorFields: Array<{ key: keyof BrandSettings; label: string }> = [
  { key: "primaryColor", label: "سبز اصلی" },
  { key: "deepColor", label: "سبز تیره" },
  { key: "accentColor", label: "طلایی اصلی" },
  { key: "accentSoftColor", label: "طلایی روشن" },
  { key: "surfaceColor", label: "پس‌زمینه روشن" },
];

export default function AdminAppearance() {
  const [form, setForm] = useState<BrandSettings>(() => readBrandSettings());
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<"site" | "app">("site");
  const fontPercent = useMemo(() => Math.round(form.fontScale * 100), [form.fontScale]);

  const update = <K extends keyof BrandSettings>(key: K, value: BrandSettings[K]) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const readAsset = (field: AssetField, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update(field, String(reader.result));
    reader.readAsDataURL(file);
  };

  const submit = () => {
    saveBrandSettings(form);
    setSaved(true);
  };

  const reset = () => {
    setForm(defaultBrandSettings);
    saveBrandSettings(defaultBrandSettings);
    setSaved(true);
  };

  return (
    <main className="admin-shell" dir="rtl">
      <aside className="admin-sidebar">
        <Link href="/" aria-label="بازگشت به سایت"><BrandLogo compact /></Link>
        <span className="admin-role">پنل ادمین اصلی</span>
        <nav>
          <button><DashboardIcon /> نمای کلی</button>
          <button className="active"><ColorWheelIcon /> هویت و ظاهر</button>
          <button><ImageIcon /> رسانه‌ها</button>
          <button><FontStyleIcon /> محتوای پایه</button>
          <button><GearIcon /> تنظیمات سامانه</button>
        </nav>
        <Link className="admin-back" href="/">مشاهده سایت</Link>
      </aside>

      <section className="admin-content">
        <header className="admin-header">
          <div>
            <span>تنظیمات مرکزی سایت و اپ</span>
            <h1>هویت و ظاهر برند</h1>
            <p>تغییرات این بخش برای سایت عمومی، وب‌اپ و اپ موبایل حاتم استفاده می‌شود؛ ساختار طراحی هرکدام مستقل باقی می‌ماند.</p>
          </div>
          <div className="admin-actions">
            <button className="reset-button" onClick={reset}><ReloadIcon /> بازنشانی</button>
            <button className="save-button" onClick={submit}><CheckCircledIcon /> ذخیره تغییرات</button>
          </div>
        </header>

        {saved && <div className="save-notice"><CheckCircledIcon /> تنظیمات برند ذخیره و روی پیش‌نمایش اعمال شد.</div>}

        <div className="appearance-layout">
          <div className="settings-column">
            <section className="settings-card">
              <div className="settings-title"><span>۰۱</span><div><h2>نام و پیام برند</h2><p>متن‌های اصلی که در سایت و اپ نمایش داده می‌شوند.</p></div></div>
              <div className="form-grid">
                <label><span>نام سایت و اپ</span><input value={form.brandName} onChange={(e) => update("brandName", e.target.value)} /></label>
                <label><span>شعار رسمی</span><input value={form.slogan} onChange={(e) => update("slogan", e.target.value)} /></label>
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-title"><span>۰۲</span><div><h2>لوگو و فاوآیکن</h2><p>فایل‌های تصویری هویت برند را بدون تغییر کد جایگزین کنید.</p></div></div>
              <div className="asset-grid">
                <label className="asset-upload">
                  <span>لوگوی اصلی</span>
                  <div><img src={form.logoUrl} alt="پیش‌نمایش لوگو" /><b>انتخاب فایل</b></div>
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => readAsset("logoUrl", e)} />
                  <small>PNG، WebP یا SVG</small>
                </label>
                <label className="asset-upload favicon-upload">
                  <span>فاوآیکن</span>
                  <div><img src={form.faviconUrl} alt="پیش‌نمایش فاوآیکن" /><b>انتخاب فایل</b></div>
                  <input type="file" accept="image/png,image/x-icon,image/svg+xml" onChange={(e) => readAsset("faviconUrl", e)} />
                  <small>ترجیحاً مربع و حداقل ۳۲×۳۲</small>
                </label>
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-title"><span>۰۳</span><div><h2>رنگ‌بندی</h2><p>پالت مرکزی تمام رابط‌ها را کنترل می‌کند.</p></div></div>
              <div className="color-grid">
                {colorFields.map(({ key, label }) => (
                  <label key={key}><span>{label}</span><div><input type="color" value={String(form[key])} onChange={(e) => update(key, e.target.value)} /><input value={String(form[key])} onChange={(e) => update(key, e.target.value)} /></div></label>
                ))}
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-title"><span>۰۴</span><div><h2>تایپوگرافی</h2><p>خانواده فونت و مقیاس کلی نوشته‌ها را تنظیم کنید.</p></div></div>
              <div className="form-grid typography-grid">
                <label><span>خانواده فونت</span><select value={form.fontFamily} onChange={(e) => update("fontFamily", e.target.value)}><option value="Vazirmatn">وزیرمتن</option><option value="Tahoma">Tahoma</option><option value="Arial">Arial</option><option value="system-ui">فونت سیستم</option></select></label>
                <label><span>اندازه کلی فونت: {fontPercent}٪</span><input type="range" min="0.85" max="1.25" step="0.05" value={form.fontScale} onChange={(e) => update("fontScale", Number(e.target.value))} /></label>
              </div>
            </section>
          </div>

          <aside className="preview-column">
            <div className="preview-head"><strong>پیش‌نمایش زنده</strong><div><button className={preview === "site" ? "active" : ""} onClick={() => setPreview("site")}>سایت</button><button className={preview === "app" ? "active" : ""} onClick={() => setPreview("app")}><MobileIcon /> اپ</button></div></div>
            <div className={`brand-preview ${preview}`} style={{
              "--preview-primary": form.primaryColor,
              "--preview-deep": form.deepColor,
              "--preview-accent": form.accentColor,
              "--preview-surface": form.surfaceColor,
              "--preview-font": `"${form.fontFamily}", Tahoma, sans-serif`,
              "--preview-scale": form.fontScale,
            } as React.CSSProperties}>
              <div className="preview-brand"><img src={form.logoUrl} alt={form.brandName} /><span>{form.slogan}</span></div>
              {preview === "site" ? <><small>انتخاب مطمئن در بازار املاک تهران</small><h2>خانه‌ای که به سبک زندگی شما می‌آید.</h2><p>فایل‌های تاییدشده و یک مسیر شفاف از جست‌وجو تا قرارداد.</p><button>شروع جست‌وجو</button></> : <><div className="preview-search">جست‌وجو در محله، منطقه یا خیابان...</div><div className="preview-shortcuts"><i>فروش</i><i>اجاره</i><i>پروژه‌ها</i></div><h2>فایل‌های ویژه</h2><div className="preview-property" /></>}
            </div>
            <p className="preview-note">پیش‌نمایش فقط ظاهر را نشان می‌دهد؛ ساختار و تجربه سایت و اپ به‌صورت مستقل طراحی می‌شوند.</p>
          </aside>
        </div>
      </section>
    </main>
  );
}
