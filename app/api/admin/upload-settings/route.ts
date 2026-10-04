import { getDb } from "../../../../db";
import { appConfigurations } from "../../../../db/schema";
import { forbidden, requireAdmin } from "../../_lib/authorization";
import { writeAudit } from "../../_lib/audit";
import { cleanUploadSettings, getUploadSettings, type UploadSettings } from "../../_lib/upload-settings";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!await requireAdmin(request)) return forbidden();
  return Response.json({ ok: true, settings: await getUploadSettings() });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return forbidden();
  const settings = cleanUploadSettings(await request.json() as Partial<UploadSettings>), now = new Date(), db = getDb();
  await db.insert(appConfigurations).values({ id: "upload-settings", value: settings as unknown as Record<string, unknown>, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({ target: appConfigurations.id, set: { value: settings as unknown as Record<string, unknown>, updatedAt: now } });
  await writeAudit(db, admin, "upload_settings.update", "app_configuration", "upload-settings", "تنظیمات بارگذاری فایل به‌روزرسانی شد.", settings as unknown as Record<string, unknown>);
  return Response.json({ ok: true, settings });
}
