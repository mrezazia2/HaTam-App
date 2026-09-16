import Link from "next/link";
import { requireRole } from "../../auth/server";
import AdminFinance from "./AdminFinance";
import "./finance.css";

export const dynamic="force-dynamic";
export default async function AdminFinancePage(){await requireRole("admin","/admin/finance");return <main className="finance-page" dir="rtl"><header className="finance-header"><div><span>مرکز عملیات مالی</span><h1>رسیدها و تسویه‌ها</h1><p>بررسی تصمیم‌های مالی همراه با شماره پیگیری و سابقه کیف پول.</p></div><Link href="/admin">بازگشت به داشبورد</Link></header><AdminFinance/></main>}
