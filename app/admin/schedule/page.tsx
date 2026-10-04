import { requireRole } from "../../auth/server";
import ScheduleConsole from "./ScheduleConsole";

export const dynamic = "force-dynamic";
export default async function AdminSchedulePage() {
  await requireRole("admin", "/admin/schedule");
  return <ScheduleConsole />;
}
