"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircledIcon, DrawingPinIcon, Share2Icon } from "@radix-ui/react-icons";
import { useBrand } from "../../brand/BrandProvider";
import PropertyActions from "./PropertyActions";

type PropertyData = { id: string; title: string; address: string; area: number; bedrooms: number; price: number; description: string; coverImage: string | null; transactionType: string; latitude: number | null; longitude: number | null };
const fa = (value: number) => value.toLocaleString("fa-IR");

export default function PropertyDetail({ property }: { property: PropertyData }) {
  const { settings } = useBrand();
  const [notice, setNotice] = useState("");
  const notify = (value: string) => { setNotice(value); window.setTimeout(() => setNotice(""), 2800); };
  const image = property.coverImage || "/assets/hatam/luxury-living.webp";
  const transaction = property.transactionType === "rent" ? "اجاره" : property.transactionType === "presale" ? "پیش‌فروش" : "فروش";
  const share = async () => {
    try { if (navigator.share) await navigator.share({ title: property.title, text: property.address, url: window.location.href }); else { await navigator.clipboard.writeText(window.location.href); notify("لینک ملک کپی شد."); } }
    catch (error) { if (error instanceof Error && error.name !== "AbortError") notify("اشتراک‌گذاری انجام نشد."); }
  };
  return <main className="property-page" dir="rtl">
    <header className="property-topbar"><Link href="/"><img src={settings.logoUrl} alt={settings.brandName}/></Link><nav><Link href="/">خانه</Link><Link href="/app">جست‌وجوی ملک</Link><Link href="/panel">پنل کاربری</Link></nav><Link className="property-login" href={`/login/user?returnTo=${encodeURIComponent(`/property/${property.id}`)}`}>ورود / ثبت‌نام</Link></header>
    <div className="property-gallery"><div className="property-gallery-main"><img src={image} alt={property.title}/><span>فایل تأییدشده حاتم</span></div><img src="/assets/hatam/penthouse.webp" alt="نمای داخلی ملک"/><img src="/assets/hatam/bright-apartment.webp" alt="فضای روشن ملک"/><button onClick={() => notify("رسانه‌های ثبت‌شده این ملک در نسخه کامل گالری نمایش داده می‌شوند.")}>مشاهده تصاویر</button></div>
    <section className="property-layout"><article className="property-detail-main">
      <div className="property-title-row"><div><span>کد فایل: {property.id.toUpperCase()}</span><h1>{property.title}</h1><p><DrawingPinIcon/>{property.address}</p></div><div><button aria-label="اشتراک‌گذاری" onClick={() => void share()}><Share2Icon/></button></div></div>
      <div className="property-price"><strong>{fa(property.price)} تومان</strong><span>{transaction} · متری {fa(Math.round(property.price / Math.max(property.area, 1)))} تومان</span></div>
      <div className="property-facts">{[[fa(property.area), "متر بنا"], [fa(property.bedrooms), "اتاق خواب"], [transaction, "نوع معامله"], ["تأییدشده", "وضعیت فایل"]].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
      <section className="property-section"><h2>درباره این ملک</h2><p>{property.description || "اطلاعات تکمیلی این ملک پس از هماهنگی با مشاور ارائه می‌شود."}</p></section>
      <section className="property-section"><h2>امکانات عمومی</h2><div className="amenities">{["بررسی اسناد", "بازدید هماهنگ‌شده", "مشاور اختصاصی", "پشتیبانی قرارداد"].map(item => <span key={item}><CheckCircledIcon/>{item}</span>)}</div></section>
      <section className="property-location"><div><h2>موقعیت ملک</h2><p>محدوده تقریبی برای حفظ حریم خصوصی مالک نمایش داده می‌شود.</p></div><img src="/assets/hatam/north-tehran-map.webp" alt="نقشه محدوده ملک"/></section>
    </article><aside className="property-contact"><span>مشاور اختصاصی این فایل</span><div className="property-advisor"><img src="/assets/hatam/advisor.webp" alt="مشاور حاتم"/><div><strong>مشاور املاک حاتم</strong><small>مشاور تأییدشده</small></div></div><PropertyActions propertyId={property.id} notify={notify}/><small>وضعیت درخواست، گفت‌وگو و یادآوری‌ها از پنل کاربری قابل پیگیری است.</small></aside></section>
    {notice && <div className="property-toast" role="status">{notice}</div>}
  </main>;
}
