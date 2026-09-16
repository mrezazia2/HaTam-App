import Link from "next/link";
import {requireRole} from "../../auth/server";
import AppMenuAdmin from "./AppMenuAdmin";
import "./menu.css";
export const dynamic="force-dynamic";
export default async function Page(){await requireRole("admin","/admin/menu");return <main className="menu-admin-page" dir="rtl"><header><div><span>شخصی‌سازی تجربه اپ</span><h1>مدیریت منوی اپ و وب‌اپ</h1><p>عنوان، عملکرد، مسیر، ترتیب و وضعیت نمایش آیتم‌های منو را بدون تغییر کد مدیریت کنید.</p></div><Link href="/admin">بازگشت به ادمین</Link></header><AppMenuAdmin/></main>}
