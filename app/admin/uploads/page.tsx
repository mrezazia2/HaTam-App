import Link from "next/link";
import UploadSettings from "./UploadSettings";
import "./uploads.css";
import "./groups.css";

export default function UploadSettingsPage() {
  return <main className="upload-settings-page" dir="rtl"><header><div><span>تنظیمات زیرساخت فایل</span><h1>بارگذاری و فرمت‌های مجاز</h1><p>محدودیت حجم و نوع فایل برای تمام پنل‌ها از اینجا کنترل می‌شود.</p></div><Link href="/admin">بازگشت به پنل</Link></header><UploadSettings /></main>;
}
