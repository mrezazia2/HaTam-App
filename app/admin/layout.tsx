import { requireRole } from "../auth/server";
import Link from "next/link";
import "./create-center.css";

export const dynamic="force-dynamic";
export default async function AdminLayout({children}:{children:React.ReactNode}){await requireRole("admin","/admin");return <>{children}<div className="admin-fab-stack"><Link href="/admin/trust">ویدیوهای اعتماد شما</Link><Link href="/admin/menu">مدیریت منوی اپ</Link><Link href="/admin/requests">درخواست‌ها</Link><Link href="/admin/create">＋ ثبت رکورد جدید</Link></div></>}
