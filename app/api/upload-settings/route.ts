import { getUploadSettings } from "../_lib/upload-settings";

export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({ ok: true, settings: await getUploadSettings() }, { headers: { "cache-control": "no-store" } });
}
