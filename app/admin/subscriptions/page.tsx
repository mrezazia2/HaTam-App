import Link from "next/link";
import { requireRole } from "../../auth/server";
import SubscriptionAdmin from "./SubscriptionAdmin";
import "./subscriptions.css";
export const dynamic="force-dynamic";
export default async function Page(){await requireRole("admin","/admin/subscriptions");return <main className="sub-admin" dir="rtl"><header><div><span>درآمد تکرارشونده</span><h1>مدیریت اشتراک‌ها</h1><p>قیمت، مدت، امکانات و وضعیت فروش پلن‌های هر نقش را بدون تغییر کد مدیریت کنید.</p></div><Link href="/admin">بازگشت به ادمین</Link></header><SubscriptionAdmin/></main>}
