import AdminBrandSettings from "../AdminBrandSettings";
import { requireRole } from "../../auth/server";
import Link from "next/link";

export const dynamic="force-dynamic";
export default async function AdminBrandPage() {
  await requireRole("admin","/admin/brand");return <><nav style={{padding:"12px 24px"}}><Link href="/admin/navigation">تنظیمات مسیرها و نقشه ←</Link></nav><AdminBrandSettings /></>;
}
