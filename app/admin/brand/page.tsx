import AdminBrandSettings from "../AdminBrandSettings";
import { requireRole } from "../../auth/server";

export const dynamic="force-dynamic";
export default async function AdminBrandPage() {
  await requireRole("admin","/admin/brand");return <AdminBrandSettings />;
}
