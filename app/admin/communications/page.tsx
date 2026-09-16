import Link from "next/link";
import { requireRole } from "../../auth/server";
import CommunicationsPolicyAdmin from "./CommunicationsPolicyAdmin";
import CommunicationCenterAdmin from "./CommunicationCenterAdmin";
import FailedSmsRetryPanel from "./FailedSmsRetryPanel";
import "./communications.css";
export const dynamic="force-dynamic";
export default async function Page(){await requireRole("admin","/admin/communications");return <main className="communications-admin" dir="rtl"><header><div><span>کنترل ارتباطات و رهگیری</span><h1>مرکز اعلان، پیامک و لاگ عملیات</h1><p>قالب‌ها، یادآوری‌ها، صف ارسال و مجوز پیامک مشاوران را به‌صورت مرکزی مدیریت کنید.</p></div><Link href="/admin">بازگشت به ادمین</Link></header><CommunicationCenterAdmin/><FailedSmsRetryPanel/><CommunicationsPolicyAdmin/></main>}
