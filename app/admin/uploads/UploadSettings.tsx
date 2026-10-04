"use client";
import { useEffect, useState } from "react";

type Settings = { imageMaxMb: number; videoMaxMb: number; documentMaxMb: number; maxPropertyFiles: number; allowedExtensions: string[] };
const defaults: Settings = { imageMaxMb: 15, videoMaxMb: 100, documentMaxMb: 50, maxPropertyFiles: 12, allowedExtensions: ["jpg", "jpeg", "png", "webp", "mp4", "webm", "mov", "m4v", "avi", "mkv", "pdf", "zip", "rar"] };
const formats = [["jpg", "JPG"], ["jpeg", "JPEG"], ["png", "PNG"], ["webp", "WEBP"], ["mp4", "MP4"], ["webm", "WEBM"], ["mov", "MOV"], ["m4v", "M4V"], ["avi", "AVI"], ["mkv", "MKV"], ["pdf", "PDF"], ["zip", "ZIP"], ["rar", "RAR"]];

export default function UploadSettings() {
  const [settings, setSettings] = useState(defaults), [saving, setSaving] = useState(false), [notice, setNotice] = useState("");
  useEffect(() => { fetch("/api/admin/upload-settings", { cache: "no-store" }).then(response => response.json()).then(body => body.settings && setSettings(body.settings)).catch(() => setNotice("دریافت تنظیمات انجام نشد.")); }, []);
  const number = (key: keyof Settings, value: string) => setSettings(current => ({ ...current, [key]: Math.max(1, Number(value.replace(/\D/g, "")) || 1) }));
  const toggle = (extension: string) => setSettings(current => ({ ...current, allowedExtensions: current.allowedExtensions.includes(extension) ? current.allowedExtensions.filter(item => item !== extension) : [...current.allowedExtensions, extension] }));
  const save = async () => { setSaving(true); setNotice(""); try { const response = await fetch("/api/admin/upload-settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(settings) }), body = await response.json(); if (!response.ok) throw new Error(body.message); setSettings(body.settings); setNotice("تنظیمات بارگذاری ذخیره شد."); } catch { setNotice("ذخیره تنظیمات انجام نشد."); } finally { setSaving(false); } };
  return <section className="upload-settings-card">
    <div className="upload-settings-grid">
      <label><span>حداکثر حجم هر تصویر (MB)</span><input inputMode="numeric" value={settings.imageMaxMb} onChange={event => number("imageMaxMb", event.target.value)} /></label>
      <label><span>حداکثر حجم هر ویدیو (MB)</span><input inputMode="numeric" value={settings.videoMaxMb} onChange={event => number("videoMaxMb", event.target.value)} /></label>
      <label><span>حداکثر حجم سند و فایل فشرده (MB)</span><input inputMode="numeric" value={settings.documentMaxMb} onChange={event => number("documentMaxMb", event.target.value)} /></label>
      <label><span>حداکثر رسانه برای هر ملک</span><input inputMode="numeric" value={settings.maxPropertyFiles} onChange={event => number("maxPropertyFiles", event.target.value)} /></label>
    </div>
    <div className="upload-format-list"><strong>فرمت‌های مجاز</strong><div>{formats.map(([extension, label]) => <label key={extension}><input type="checkbox" checked={settings.allowedExtensions.includes(extension)} onChange={() => toggle(extension)} /><span>{label}</span></label>)}</div></div>
    <p>ZIP، RAR و PDF برای مدارک و پیوست‌ها فعال می‌شوند؛ فرم رسانه ملک فقط تصویر و ویدیو را می‌پذیرد.</p>
    <footer><button disabled={saving || !settings.allowedExtensions.length} onClick={save}>{saving ? "در حال ذخیره…" : "ذخیره تنظیمات آپلود"}</button></footer>
    {notice && <div className="upload-settings-notice">{notice}</div>}
  </section>;
}
