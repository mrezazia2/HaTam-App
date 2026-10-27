"use client";

import { useEffect, useState } from "react";
import MapLocationPicker from "../components/MapLocationPicker";
import PropertyMediaUploader, { type PropertyMedia } from "../components/PropertyMediaUploader";

type Role = "user" | "consultant" | "agency";
type PropertyItem = {
  id: string; title: string; address: string; district: string | null; transactionType: "sale" | "rent" | "presale";
  propertyType: string; area: number; bedrooms: number; price: number; description: string;
  latitude: number | null; longitude: number | null; status: string; coverImage: string | null;
};
type History = { id: string; fromStatus: string | null; toStatus: string; note: string; createdAt: string | number };
const labels: Record<string, string> = { draft: "پیش‌نویس", pending: "در انتظار بررسی", published: "منتشرشده", rejected: "ردشده", archived: "بایگانی" };
const numericText = (value: string) => value.replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/\D/g, "");

function editableDescription(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? String(parsed.description || "") : "";
  } catch { return value; }
}
function mergedDescription(original: string, description: string) {
  try {
    const parsed = JSON.parse(original);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return JSON.stringify({ ...parsed, description });
  } catch {}
  return description;
}

export default function PropertyManagerModal({ role, propertyId, onClose, onSaved }: { role: Role; propertyId: string; onClose: () => void; onSaved: () => void }) {
  const [item, setItem] = useState<PropertyItem | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [media, setMedia] = useState<PropertyMedia[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [tab, setTab] = useState<"edit" | "history">("edit");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const headers = { "x-hatam-preview-role": role };
    Promise.all([
      fetch(`/api/properties/${encodeURIComponent(propertyId)}`, { headers, cache: "no-store" }).then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error); return body; }),
      fetch(`/api/properties/${encodeURIComponent(propertyId)}/history`, { headers, cache: "no-store" }).then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error); return body; }),
    ]).then(([propertyBody, historyBody]) => {
      const property = propertyBody.item as PropertyItem;
      const propertyMedia = propertyBody.media as PropertyMedia[] || [];
      const coverIndex = propertyMedia.findIndex(entry => property.coverImage?.includes(entry.key));
      const orderedMedia = coverIndex > 0 ? [propertyMedia[coverIndex], ...propertyMedia.filter((_, index) => index !== coverIndex)] : propertyMedia;
      setItem(property);
      setMedia(orderedMedia);
      setHistory(historyBody.items || []);
      setLatitude(property.latitude);
      setLongitude(property.longitude);
      setForm({
        title: property.title, address: property.address, district: property.district || "",
        transactionType: property.transactionType, propertyType: property.propertyType,
        area: String(property.area), bedrooms: String(property.bedrooms), price: String(property.price),
        description: editableDescription(property.description),
        status: ["published", "vip", "rejected"].includes(property.status) ? "pending" : property.status,
      });
    }).catch(() => setError("دریافت اطلاعات کامل ملک انجام نشد.")).finally(() => setLoading(false));
  }, [propertyId, role]);

  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));
  const save = async () => {
    if (!item) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/properties/${encodeURIComponent(propertyId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-hatam-preview-role": role },
        body: JSON.stringify({
          ...form,
          area: Number(form.area), bedrooms: Number(form.bedrooms), price: Number(form.price),
          latitude, longitude, description: mergedDescription(item.description, form.description || ""),
          mediaKeys: media.map(entry => entry.key), coverMediaKey: media.find(entry => entry.type.startsWith("image/"))?.key || "",
          note: item.status === "published" ? "ویرایش فایل منتشرشده و ارسال مجدد برای بررسی" : "ویرایش اطلاعات ملک از پنل",
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      onSaved();
      onClose();
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : "";
      setError(code === "INVALID_MEDIA_OWNERSHIP" ? "یکی از رسانه‌ها متعلق به این حساب یا ملک نیست." : "عنوان، آدرس، مشخصات عددی و موقعیت ملک را بررسی کنید.");
    } finally { setSaving(false); }
  };

  return <div className="portal-modal property-manager-modal" role="presentation" onMouseDown={onClose}>
    <section role="dialog" aria-modal="true" aria-label="مدیریت فایل ملک" onMouseDown={event => event.stopPropagation()}>
      <header><div><span>فایل {propertyId}</span><h2>ویرایش و تاریخچه ملک</h2></div><button onClick={onClose} aria-label="بستن">×</button></header>
      <div className="property-manager-tabs"><button className={tab === "edit" ? "active" : ""} onClick={() => setTab("edit")}>اطلاعات و رسانه</button><button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>تاریخچه وضعیت</button></div>
      {loading && <div className="portal-empty">در حال دریافت اطلاعات…</div>}
      {!loading && error && !item && <p className="portal-form-error" role="alert">{error}</p>}
      {item && tab === "edit" && <div className="property-manager-form">
        {["published", "rejected"].includes(item.status) && <p className="property-review-note">این فایل اکنون «{labels[item.status]}» است؛ ذخیره تغییرات آن را دوباره به صف بررسی ادمین می‌فرستد.</p>}
        <div className="property-manager-grid">
          <label><span>عنوان ملک</span><input value={form.title || ""} onChange={event => set("title", event.target.value)} /></label>
          <label><span>نوع معامله</span><select value={form.transactionType || "sale"} onChange={event => set("transactionType", event.target.value)}><option value="sale">فروش</option><option value="rent">اجاره</option><option value="presale">پیش‌فروش</option></select></label>
          <label className="wide"><span>آدرس کامل</span><input value={form.address || ""} onChange={event => set("address", event.target.value)} /></label>
          <label><span>منطقه یا محله</span><input value={form.district || ""} onChange={event => set("district", event.target.value)} /></label>
          <label><span>نوع ملک</span><input value={form.propertyType || ""} onChange={event => set("propertyType", event.target.value)} /></label>
          <label><span>متراژ</span><input inputMode="numeric" value={form.area ? Number(form.area).toLocaleString("fa-IR") : ""} onChange={event => set("area", numericText(event.target.value))} /></label>
          <label><span>تعداد خواب</span><input inputMode="numeric" value={form.bedrooms ? Number(form.bedrooms).toLocaleString("fa-IR") : "۰"} onChange={event => set("bedrooms", numericText(event.target.value))} /></label>
          <label><span>قیمت (تومان)</span><input inputMode="numeric" value={form.price ? Number(form.price).toLocaleString("fa-IR") : "۰"} onChange={event => set("price", numericText(event.target.value))} /></label>
          <label><span>وضعیت پس از ذخیره</span><select value={form.status || "pending"} onChange={event => set("status", event.target.value)}><option value="draft">پیش‌نویس</option><option value="pending">ارسال برای بررسی</option><option value="archived">بایگانی</option></select></label>
          <label className="wide"><span>توضیحات عمومی</span><textarea value={form.description || ""} onChange={event => set("description", event.target.value)} /></label>
        </div>
        <PropertyMediaUploader role={role} value={media} onChange={setMedia} />
        <p className="property-cover-help">اولین رسانه تصویری به‌عنوان کاور ذخیره می‌شود؛ با دکمه «انتخاب کاور» ترتیب را تغییر دهید.</p>
        <MapLocationPicker compact latitude={latitude} longitude={longitude} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />
        {error && <p className="portal-form-error" role="alert">{error}</p>}
        <footer><button onClick={onClose}>انصراف</button><button className="portal-primary" disabled={saving} onClick={save}>{saving ? "در حال ذخیره…" : "ذخیره تغییرات"}</button></footer>
      </div>}
      {item && tab === "history" && <div className="property-history-list">
        {history.map(entry => <article key={entry.id}><i /><div><strong>{entry.fromStatus ? `${labels[entry.fromStatus] || entry.fromStatus} ← ${labels[entry.toStatus] || entry.toStatus}` : labels[entry.toStatus] || entry.toStatus}</strong><p>{entry.note || "بدون توضیح"}</p><time>{new Date(entry.createdAt).toLocaleString("fa-IR")}</time></div></article>)}
        {!history.length && <div className="portal-empty">هنوز سابقه‌ای برای این ملک ثبت نشده است.</div>}
      </div>}
    </section>
  </div>;
}
