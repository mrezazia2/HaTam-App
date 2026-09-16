import Link from "next/link";
import {requireRole} from "../../auth/server";
import ContactAdmin from "./ContactAdmin";
import "./contact-admin.css";
export const dynamic="force-dynamic";
export default async function Page(){await requireRole("admin","/admin/contact");return <main className="contact-admin-page" dir="rtl"><header><div><span>صفحه‌ساز ارتباطی</span><h1>مدیریت صفحه ارتباط با ما</h1><p>متن، آدرس، شماره‌های تماس، لینک نقشه‌ها و شبکه‌های اجتماعی را بدون تغییر کد مدیریت کنید.</p></div><Link href="/admin">بازگشت به ادمین</Link></header><ContactAdmin/></main>}
