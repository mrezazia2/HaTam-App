import AdminWorkspace from "./AdminWorkspace";
import Link from "next/link";
import LogoutButton from "../auth/LogoutButton";
import { requireRole } from "../auth/server";
import CommunicationsDock from "../communications/CommunicationsDock";

export const dynamic="force-dynamic";
export default async function AdminPage(){await requireRole("admin","/admin");return <><div className="admin-integrations-shortcut"><Link href="/admin/integrations">تنظیمات زیرساخت</Link><Link href="/admin/uploads">تنظیمات آپلود</Link><Link href="/admin/contact">صفحه ارتباط با ما</Link><Link href="/admin/cooperate">صفحه همکاری با ما</Link><Link href="/admin/finance">عملیات مالی</Link><Link href="/admin/subscriptions">اشتراک‌ها</Link><Link href="/admin/schedule">بازدیدها و مشاوره‌ها</Link><Link href="/admin/communications">پیامک مشاوران و لاگ‌ها</Link></div><AdminWorkspace/><CommunicationsDock role="admin"/><LogoutButton/></>}
