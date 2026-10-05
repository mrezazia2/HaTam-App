import { requireRole } from "../auth/server";
import AdminToolbar from "./AdminToolbar";
import "./toolbar.css";

export const dynamic="force-dynamic";
export default async function AdminLayout({children}:{children:React.ReactNode}){await requireRole("admin","/admin");return <div className="admin-shell"><AdminToolbar/>{children}</div>}
