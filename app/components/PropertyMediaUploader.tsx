"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Cross2Icon, ImageIcon, UploadIcon, VideoIcon } from "@radix-ui/react-icons";
import "./property-media-uploader.css";

export type PropertyMedia = { key: string; url: string; name: string; type: string; size: number };
type UploadSettings = { imageMaxMb: number; videoMaxMb: number; maxPropertyFiles: number; allowedExtensions: string[] };
const fallback: UploadSettings = { imageMaxMb: 15, videoMaxMb: 100, maxPropertyFiles: 12, allowedExtensions: ["jpg", "jpeg", "png", "webp", "mp4", "webm", "mov", "m4v", "avi", "mkv"] };

export default function PropertyMediaUploader({ role, value, onChange }: { role: "admin" | "user" | "consultant" | "agency"; value: PropertyMedia[]; onChange: (items: PropertyMedia[]) => void }) {
  const inFlight = useRef(false);
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
      for (const file of Array.from(files).slice(0, settings.maxPropertyFiles - value.length)) {
        const data = new FormData();
        data.set("file", file);
        const response = await fetch("/api/property-media", { method: "POST", headers: { "x-hatam-preview-role": role }, body: data });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "UPLOAD_FAILED");
        created.push(result.item);
      }
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : "";
      setError(code === "MEDIA_STORAGE_UNAVAILABLE" ? "فضای ذخیره‌سازی سرور در دسترس نیست؛ مدیر سرور باید اتصال دیسک رسانه را بررسی کند." : code === "FILE_TOO_LARGE" ? "حجم فایل از محدودیت تعیین‌شده در تنظیمات بیشتر است." : code === "FILE_TYPE_NOT_ALLOWED" ? "فرمت این فایل در تنظیمات بارگذاری مجاز نشده است." : "بارگذاری برخی فایل‌ها انجام نشد؛ فایل‌های موفق حفظ شدند. اتصال را بررسی و دوباره تلاش کنید.");
    } finally {
      if (created.length) onChange([...value, ...created]);
      inFlight.current = false;
      setBusy(false);
    }
  };
  const remove = async (item: PropertyMedia) => {
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
    <label><UploadIcon /><strong>{busy ? "در حال بارگذاری..." : "افزودن عکس و ویدیو ملک"}</strong><small>حداکثر {settings.maxPropertyFiles.toLocaleString("fa-IR")} فایل؛ تصویر تا {settings.imageMaxMb.toLocaleString("fa-IR")} و ویدیو تا {settings.videoMaxMb.toLocaleString("fa-IR")} مگابایت</small><input disabled={busy || value.length >= settings.maxPropertyFiles} type="file" accept={mediaExtensions.map(extension => `.${extension}`).join(",")} multiple onChange={event => { void upload(event.target.files); event.target.value = ""; }} /></label>
    {value.length > 0 && <div className="property-media-grid">{value.map(item => <article key={item.key}>
      {item.type.startsWith("video") ? <video src={item.url} controls preload="metadata" /> : <img src={item.url} alt={item.name} />}
      <button className="media-delete-button" type="button" disabled={busy} onClick={() => remove(item)} aria-label={`حذف ${item.name}`}><Cross2Icon /></button>
      <span>{item.type.startsWith("video") ? <VideoIcon /> : <ImageIcon />}{item.key === coverKey ? <b>کاور</b> : item.type.startsWith("image/") && <button className="media-cover-button" type="button" onClick={() => makeCover(item)}>انتخاب کاور</button>}<small>{item.name}</small></span>
    </article>)}</div>}
    {error && <p>{error}</p>}
  </section>;
}
