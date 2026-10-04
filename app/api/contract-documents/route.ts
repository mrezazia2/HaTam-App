import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { contractDocuments, contracts } from "../../../db/schema";
import { writeAudit } from "../_lib/audit";
import { getRequestAccount } from "../_lib/authorization";
import { getUploadSettings, validateUpload } from "../_lib/upload-settings";

const local = (url: URL) => url.hostname === "localhost" || url.hostname === "127.0.0.1";

function canAccess(account: Awaited<ReturnType<typeof getRequestAccount>>, contract: typeof contracts.$inferSelect) {
  return Boolean(account && (account.role === "admin" || (account.role === "agency" && account.agencyId === contract.agencyId) || (account.role === "consultant" && account.id === contract.consultantAccountId) || (account.role === "user" && account.id === contract.customerAccountId)));
}

export async function GET(request: Request) {
  const url = new URL(request.url), headers = new Headers(request.headers);
  if (local(url) && url.searchParams.get("previewRole")) headers.set("x-hatam-preview-role", url.searchParams.get("previewRole")!);
  const account = await getRequestAccount(new Request(url.toString(), { headers })), db = getDb();
  if (!account || account.status !== "active") return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  const key = url.searchParams.get("key"), contractId = url.searchParams.get("contractId") || "";
  if (key) {
    const document = (await db.select().from(contractDocuments).where(and(eq(contractDocuments.objectKey, key), eq(contractDocuments.status, "active"))).limit(1))[0];
    if (!document) return new Response("Not found", { status: 404 });
    const contract = (await db.select().from(contracts).where(eq(contracts.id, document.contractId)).limit(1))[0];
    if (!contract || !canAccess(account, contract)) return new Response("Forbidden", { status: 403 });
    const object = env.MEDIA ? await env.MEDIA.get(key) : null;
    if (!object) return new Response("Not found", { status: 404 });
    return new Response(object.body, { headers: { "content-type": document.contentType, "content-length": String(document.size), "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.fileName)}`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
  }
  const contract = (await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1))[0];
  if (!contract || !canAccess(account, contract)) return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const rows = await db.select().from(contractDocuments).where(and(eq(contractDocuments.contractId, contractId), eq(contractDocuments.status, "active")));
  const preview = local(url) ? `&previewRole=${encodeURIComponent(account.role)}` : "";
  return Response.json({ ok: true, items: rows.map(item => ({ id: item.id, key: item.objectKey, name: item.fileName, type: item.contentType, size: item.size, url: `/api/contract-documents?key=${encodeURIComponent(item.objectKey)}${preview}` })) });
}

export async function POST(request: Request) {
  const account = await getRequestAccount(request);
  if (!account || account.status !== "active") return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  if (!env.MEDIA) return Response.json({ ok: false, error: "MEDIA_STORAGE_UNAVAILABLE" }, { status: 503 });
  const data = await request.formData(), file = data.get("file"), contractId = String(data.get("contractId") || ""), db = getDb();
  const contract = (await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1))[0];
  if (!contract || !canAccess(account, contract)) return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  if (!(file instanceof File)) return Response.json({ ok: false, error: "INVALID_FILE" }, { status: 400 });
  const validation = validateUpload(file, await getUploadSettings(), "document");
  if (!validation.ok) return Response.json({ ok: false, error: validation.error, maxMb: "maxMb" in validation ? validation.maxMb : undefined }, { status: 400 });
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120) || "document", key = `contracts/${contractId}/${crypto.randomUUID()}-${safe}`, id = `CD-${crypto.randomUUID()}`, now = new Date();
  await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { contractId, uploadedBy: account.id } });
  try {
    await db.insert(contractDocuments).values({ id, contractId, objectKey: key, uploadedBy: account.id, fileName: file.name.slice(0, 240), contentType: file.type, size: file.size, status: "active", createdAt: now, updatedAt: now });
    await writeAudit(db, account, "contract.document_uploaded", "contract_document", id, "مدرک قرارداد بارگذاری شد.", { contractId, contentType: file.type, size: file.size });
  } catch (error) { await env.MEDIA.delete(key); throw error; }
  return Response.json({ ok: true, item: { id, key, name: file.name, type: file.type, size: file.size } }, { status: 201 });
}

export async function DELETE(request: Request) {
  const account = await getRequestAccount(request), key = new URL(request.url).searchParams.get("key") || "", db = getDb();
  if (!account || account.status !== "active") return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  const document = (await db.select().from(contractDocuments).where(and(eq(contractDocuments.objectKey, key), eq(contractDocuments.status, "active"))).limit(1))[0];
  if (!document) return Response.json({ ok: true });
  const contract = (await db.select().from(contracts).where(eq(contracts.id, document.contractId)).limit(1))[0];
  if (!contract || !canAccess(account, contract) || (account.role === "user" && document.uploadedBy !== account.id)) return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  if (env.MEDIA) await env.MEDIA.delete(key);
  await db.update(contractDocuments).set({ status: "deleted", updatedAt: new Date() }).where(eq(contractDocuments.id, document.id));
  await writeAudit(db, account, "contract.document_deleted", "contract_document", document.id, "مدرک قرارداد حذف شد.", { contractId: document.contractId });
  return Response.json({ ok: true });
}
