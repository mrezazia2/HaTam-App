import Link from "next/link";
import {requireRole} from "../../auth/server";
import NavigationAdmin from "./NavigationAdmin";
import "./style.css";
export const dynamic="force-dynamic";
export default async function Page(){await requireRole("admin","/admin/navigation");return <main className="navigation-admin" dir="rtl"><header><div><span>رفتار سامانه</span><h1>مسیرها و نمایش نقشه</h1><p>مقصد ورود هر نقش در سایت و اپ، خروج و نمایش نقشه را بدون تغییر کد تنظیم کنید.</p></div><Link href="/admin">بازگشت به مدیریت</Link></header><NavigationAdmin/></main>}
