import Link from "next/link";
import {requireRole} from "../../auth/server";
import TrustVideoAdmin from "./TrustVideoAdmin";
import "./trust-content-admin.css";
export const dynamic="force-dynamic";
export default async function Page(){await requireRole("admin","/admin/trust");return <main className="trust-admin-page" dir="rtl"><header><div><span>مدیریت محتوای اپ</span><h1>ویدیوهای اعتماد شما</h1><p>ویدیوهای رضایت مشتریان را بارگذاری، مرتب، غیرفعال یا حذف کنید.</p></div><Link href="/admin">بازگشت به ادمین</Link></header><TrustVideoAdmin/></main>}
