import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../../db";
import { accounts, properties, propertyMedia, propertyStatusHistory } from "../../../../db/schema";
import { canManageProperty } from "../../_lib/property-access";
import { publicProperty } from "../../_lib/public-property";
import { getRequestAccount } from "../../_lib/authorization";
import { writeAudit } from "../../_lib/audit";

export const dynamic = "force-dynamic";
const transactionTypes = ["sale", "rent", "presale"] as const;

function mediaUrl(request: Request, key: string, role: string) {
  const url = new URL(request.url);
  const preview = (url.hostname === "localhost" || url.hostname === "127.0.0.1") ? `&previewRole=${encodeURIComponent(role)}` : "";
  return `/api/property-media?key=${encodeURIComponent(key)}${preview}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const row = (await db.select().from(properties).where(eq(properties.id, id)).limit(1))[0];
  if (!row) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  const account = await getRequestAccount(request);
  const manages = canManageProperty(account, row);
  if (row.status !== "published" && !manages) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  const rows = await db.select().from(propertyMedia).where(and(eq(propertyMedia.propertyId, id), eq(propertyMedia.status, "active")));
  const advisor = row.consultantAccountId
    ? (await db.select({ id: accounts.id, name: accounts.name, mobile: accounts.mobile, status: accounts.status }).from(accounts).where(eq(accounts.id, row.consultantAccountId)).limit(1))[0]
    : null;
  const media = rows.map(item => ({
    key: item.objectKey,
    url: mediaUrl(request, item.objectKey, account?.role || "user"),
    name: item.fileName,
    type: item.contentType,
    size: item.size,
  }));
  const publicAdvisor = advisor?.status === "active" ? { id: advisor.id, name: advisor.name || "مشاور حاتم", mobile: advisor.mobile } : null;
  if (!manages) return Response.json({ ok: true, item: publicProperty(row), media, advisor: publicAdvisor });
  return Response.json({
    ok: true,
    item: row,
    media,
    advisor: publicAdvisor,
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getRequestAccount(request);
  if (!account || account.status !== "active") return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  const row = (await db.select().from(properties).where(eq(properties.id, id)).limit(1))[0];
  if (!row) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (!canManageProperty(account, row)) return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const value = await request.json() as Record<string, unknown>;
  const requested = String(value.status ?? row.status);
  const allowedStatuses = account.role === "admin" ? ["draft", "pending", "published", "rejected", "archived"] : ["draft", "pending", "archived"];
  if (!allowedStatuses.includes(requested)) return Response.json({ ok: false, error: "INVALID_STATUS" }, { status: 400 });
  const title = value.title === undefined ? row.title : String(value.title).trim();
  const address = value.address === undefined ? row.address : String(value.address).trim();
  const transactionType = String(value.transactionType ?? row.transactionType);
  const number = (key: string, current: number | null) => value[key] === undefined ? current : Number(value[key]);
  const latitude = number("latitude", row.latitude), longitude = number("longitude", row.longitude);
  const area = number("area", row.area), bedrooms = number("bedrooms", row.bedrooms), price = number("price", row.price);
  if (title.length < 3 || address.length < 5 || !transactionTypes.includes(transactionType as typeof transactionTypes[number]) ||
    (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
    (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) ||
    !area || area <= 0 || bedrooms === null || bedrooms < 0 || price === null || price < 0) {
    return Response.json({ ok: false, error: "INVALID_PROPERTY" }, { status: 400 });
  }

  const currentMedia = await db.select().from(propertyMedia).where(and(eq(propertyMedia.propertyId, id), eq(propertyMedia.status, "active")));
  const requestedKeys = Array.isArray(value.mediaKeys) ? Array.from(new Set(value.mediaKeys.map(String).filter(Boolean))) : currentMedia.map(item => item.objectKey);
  if (requestedKeys.length > 12) return Response.json({ ok: false, error: "TOO_MANY_MEDIA" }, { status: 400 });
  const currentKeys = new Set(currentMedia.map(item => item.objectKey));
  const newKeys = requestedKeys.filter(key => !currentKeys.has(key));
  if (newKeys.length) {
    const uploaded = await db.select().from(propertyMedia).where(and(inArray(propertyMedia.objectKey, newKeys), eq(propertyMedia.ownerAccountId, account.id), eq(propertyMedia.status, "active")));
    if (uploaded.length !== newKeys.length || uploaded.some(item => item.propertyId && item.propertyId !== id)) {
      return Response.json({ ok: false, error: "INVALID_MEDIA_OWNERSHIP" }, { status: 403 });
    }
  }

  const coverKey = String(value.coverMediaKey ?? "");
  if (coverKey && !requestedKeys.includes(coverKey)) return Response.json({ ok: false, error: "INVALID_COVER" }, { status: 400 });
  const coverImage = coverKey ? `/api/property-media?key=${encodeURIComponent(coverKey)}` : value.coverImage === undefined ? row.coverImage : String(value.coverImage || "") || null;
  const timestamp = new Date();
  if (newKeys.length) await db.update(propertyMedia).set({ propertyId: id, updatedAt: timestamp }).where(and(inArray(propertyMedia.objectKey, newKeys), eq(propertyMedia.ownerAccountId, account.id), eq(propertyMedia.status, "active")));
  await db.update(properties).set({
    title, address,
    district: value.district === undefined ? row.district : String(value.district) || null,
    latitude, longitude,
    transactionType: transactionType as typeof row.transactionType,
    propertyType: value.propertyType === undefined ? row.propertyType : String(value.propertyType || "apartment"),
    area: Math.round(area), bedrooms: Math.round(bedrooms), price: Math.round(price),
    description: value.description === undefined ? row.description : String(value.description),
    coverImage, status: requested as typeof row.status,
    featured: account.role === "admin" && value.featured !== undefined ? Boolean(value.featured) : row.featured,
    updatedAt: timestamp,
  }).where(eq(properties.id, id));
  if (requested !== row.status) {
    await db.insert(propertyStatusHistory).values({
      id: `PH-${crypto.randomUUID()}`, propertyId: id, actorAccountId: account.id,
      fromStatus: row.status, toStatus: requested, note: String(value.note || "ویرایش و ارسال مجدد"), createdAt: timestamp,
    });
  }
  await writeAudit(db, account, "property.updated", "property", id, "اطلاعات ملک ویرایش شد.", { fromStatus: row.status, toStatus: requested, mediaAdded: newKeys.length });
  return Response.json({ ok: true, id, status: requested });
}
