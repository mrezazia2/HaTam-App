import { env } from "cloudflare:workers";
import { and, eq, like, ne } from "drizzle-orm";
import { getDb } from "../../../db";
import { properties, propertyMedia, propertyStatusHistory, urgentSaleRequests } from "../../../db/schema";
import { writeAudit } from "../_lib/audit";
import { getRequestAccount } from "../_lib/authorization";
import { canManageProperty } from "../_lib/property-access";
import { getUploadSettings, uploadCategory, validateUpload } from "../_lib/upload-settings";

const local = (url: URL) => url.hostname === "localhost" || url.hostname === "127.0.0.1";

export async function POST(request: Request) {
  const account = await getRequestAccount(request);
  if (!account || account.status !== "active") return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  if (!env.MEDIA) return Response.json({ ok: false, error: "MEDIA_STORAGE_UNAVAILABLE" }, { status: 503 });
  const data = await request.formData(), file = data.get("file");
  if (!(file instanceof File)) return Response.json({ ok: false, error: "INVALID_FILE" }, { status: 400 });
  const validation = validateUpload(file, await getUploadSettings(), "property");
  if (!validation.ok) return Response.json({ ok: false, error: validation.error, maxMb: "maxMb" in validation ? validation.maxMb : undefined }, { status: 400 });
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120) || "media";
  const key = `properties/${account.id}/${crypto.randomUUID()}-${safe}`, id = `PM-${crypto.randomUUID()}`, now = new Date(), db = getDb();
  await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { ownerAccountId: account.id, mediaId: id } });
  try {
    const contentType = file.type || (uploadCategory(file) === "image" ? "image/jpeg" : "video/mp4");
    await db.insert(propertyMedia).values({ id, objectKey: key, ownerAccountId: account.id, propertyId: null, fileName: file.name.slice(0, 240), contentType, size: file.size, status: "active", createdAt: now, updatedAt: now });
    await writeAudit(db, account, "property_media.uploaded", "property_media", id, "رسانه ملک بارگذاری شد.", { contentType: file.type, size: file.size });
  } catch (error) {
    await env.MEDIA.delete(key);
    throw error;
  }
  const preview = local(new URL(request.url)) ? `&previewRole=${encodeURIComponent(account.role)}` : "";
  const contentType = file.type || (uploadCategory(file) === "image" ? "image/jpeg" : "video/mp4");
  return Response.json({ ok: true, item: { key, url: `/api/property-media?key=${encodeURIComponent(key)}${preview}`, name: file.name, type: contentType, size: file.size } }, { status: 201 });
}

async function accountForMediaRequest(request: Request) {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  if (local(url) && url.searchParams.get("previewRole")) headers.set("x-hatam-preview-role", url.searchParams.get("previewRole")!);
  return getRequestAccount(new Request(url.toString(), { headers }));
}

export async function GET(request: Request) {
  const url = new URL(request.url), key = url.searchParams.get("key") || "";
  if (!key.startsWith("properties/") || !env.MEDIA) return new Response("Not found", { status: 404 });
  const db = getDb();
  const record = (await db.select().from(propertyMedia).where(and(eq(propertyMedia.objectKey, key), eq(propertyMedia.status, "active"))).limit(1))[0];
  if (!record) return new Response("Not found", { status: 404 });
  const property = record.propertyId ? (await db.select().from(properties).where(eq(properties.id, record.propertyId)).limit(1))[0] : null;
  const urgentSale = record.urgentSaleId ? (await db.select().from(urgentSaleRequests).where(eq(urgentSaleRequests.id, record.urgentSaleId)).limit(1))[0] : null;
  const isPublic = property?.status === "published";
  if (!isPublic) {
    const account = await accountForMediaRequest(request);
    if (!account || (account.role !== "admin" && account.id !== record.ownerAccountId && (!property || !canManageProperty(account, property)) && urgentSale?.assignedConsultantId !== account.id)) {
      return new Response("Forbidden", { status: 403 });
    }
  }
  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: {
    "content-type": record.contentType, "content-length": String(record.size),
    "cache-control": isPublic ? "public, max-age=86400" : "private, no-store", "x-content-type-options": "nosniff",
  } });
}

export async function DELETE(request: Request) {
  const account = await getRequestAccount(request), key = new URL(request.url).searchParams.get("key") || "";
  if (!account || account.status !== "active") return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  const db = getDb();
  const record = (await db.select().from(propertyMedia).where(and(eq(propertyMedia.objectKey, key), eq(propertyMedia.status, "active"))).limit(1))[0];
  if (!record) return Response.json({ ok: true });
  const property = record.propertyId ? (await db.select().from(properties).where(eq(properties.id, record.propertyId)).limit(1))[0] : null;
  const manages = property ? canManageProperty(account, property) : account.id === record.ownerAccountId;
  if (account.role !== "admin" && account.id !== record.ownerAccountId && !manages) return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const now = new Date();
  if (env.MEDIA) await env.MEDIA.delete(key);
  await db.update(propertyMedia).set({ status: "deleted", updatedAt: now }).where(eq(propertyMedia.id, record.id));
  if (property) {
    const nextMedia = (await db.select().from(propertyMedia).where(and(eq(propertyMedia.propertyId, property.id), eq(propertyMedia.status, "active"), ne(propertyMedia.id, record.id), like(propertyMedia.contentType, "image/%"))).limit(1))[0];
    const coverWasDeleted = Boolean(property.coverImage?.includes(record.objectKey));
    const nextStatus = property.status === "published" && account.role !== "admin" ? "pending" : property.status;
    await db.update(properties).set({
      ...(coverWasDeleted ? { coverImage: nextMedia ? `/api/property-media?key=${encodeURIComponent(nextMedia.objectKey)}` : null } : {}),
      status: nextStatus, updatedAt: now,
    }).where(eq(properties.id, property.id));
    if (nextStatus !== property.status) {
      await db.insert(propertyStatusHistory).values({
        id: `PH-${crypto.randomUUID()}`, propertyId: property.id, actorAccountId: account.id,
        fromStatus: property.status, toStatus: nextStatus, note: "تغییر رسانه و ارسال مجدد برای بررسی", createdAt: now,
      });
    }
  }
  await writeAudit(db, account, "property_media.deleted", "property_media", record.id, "رسانه ملک حذف شد.", { propertyId: record.propertyId });
  return Response.json({ ok: true, status: property?.status === "published" && account.role !== "admin" ? "pending" : property?.status });
}
