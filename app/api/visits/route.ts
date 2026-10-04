import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { accounts, agencyMembers, properties, visits } from "../../../db/schema";
import { writeAudit } from "../_lib/audit";
import { getRequestAccount } from "../_lib/authorization";
import { cancelWorkflowReminders, createWorkflowConversation, notifyWorkflow, replaceWorkflowReminders } from "../_lib/workflow-communications";

export const dynamic = "force-dynamic";
const statuses = ["requested", "confirmed", "completed", "cancelled"] as const;

async function activeConsultant(db: ReturnType<typeof getDb>, id: string, agencyId?: string | null) {
  const consultant = (await db.select().from(accounts).where(and(eq(accounts.id, id), eq(accounts.role, "consultant"), eq(accounts.status, "active"))).limit(1))[0];
  if (!consultant || (agencyId && consultant.agencyId !== agencyId)) return null;
  return consultant;
}

export async function GET(request: Request) {
  const account = await getRequestAccount(request);
  if (!account || account.status !== "active") return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  const db = getDb();
  const joined = await db.select({ visit: visits, propertyTitle: properties.title, propertyAgencyId: properties.agencyId }).from(visits).leftJoin(properties, eq(visits.propertyId, properties.id)).orderBy(desc(visits.scheduledAt));
  const scoped = joined.filter(row => account.role === "admin" || (account.role === "user" && row.visit.customerAccountId === account.id) || (account.role === "consultant" && row.visit.consultantAccountId === account.id) || (account.role === "agency" && account.agencyId && row.propertyAgencyId === account.agencyId));
  const accountIds = [...new Set(scoped.flatMap(row => [row.visit.customerAccountId, row.visit.consultantAccountId]).filter(Boolean) as string[])];
  const people = accountIds.length ? await db.select({ id: accounts.id, name: accounts.name, mobile: accounts.mobile }).from(accounts).where(inArray(accounts.id, accountIds)) : [];
  const names = new Map(people.map(person => [person.id, person]));
  const options = account.role === "agency" && account.agencyId
    ? await db.select({ id: accounts.id, name: accounts.name }).from(agencyMembers).innerJoin(accounts, eq(agencyMembers.accountId, accounts.id)).where(and(eq(agencyMembers.agencyId, account.agencyId), eq(agencyMembers.status, "active"), eq(accounts.status, "active")))
    : account.role === "admin" ? await db.select({ id: accounts.id, name: accounts.name }).from(accounts).where(and(eq(accounts.role, "consultant"), eq(accounts.status, "active"))) : [];
  return Response.json({ ok: true, items: scoped.map(row => ({ ...row.visit, propertyTitle: row.propertyTitle, customerName: names.get(row.visit.customerAccountId)?.name || "کاربر", customerMobile: names.get(row.visit.customerAccountId)?.mobile || "", consultantName: row.visit.consultantAccountId ? names.get(row.visit.consultantAccountId)?.name || "مشاور" : null })), consultants: options });
}

export async function POST(request: Request) {
  const account = await getRequestAccount(request);
  if (!account || account.status !== "active" || !["user", "admin"].includes(account.role)) return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  const value = await request.json() as { propertyId?: string; scheduledAt?: string; customerAccountId?: string; consultantAccountId?: string };
  const db = getDb(), property = (await db.select().from(properties).where(eq(properties.id, value.propertyId || "")).limit(1))[0];
  if (!property || property.status !== "published") return Response.json({ ok: false, error: "PROPERTY_NOT_AVAILABLE" }, { status: 404 });
  const customerAccountId = account.role === "user" ? account.id : String(value.customerAccountId || "");
  const customer = (await db.select().from(accounts).where(and(eq(accounts.id, customerAccountId), eq(accounts.role, "user"), eq(accounts.status, "active"))).limit(1))[0];
  if (!customer) return Response.json({ ok: false, error: "CUSTOMER_NOT_FOUND" }, { status: 400 });
  const scheduledAt = new Date(value.scheduledAt || Date.now() + 24 * 60 * 60_000);
  if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now()) return Response.json({ ok: false, error: "INVALID_SCHEDULE" }, { status: 400 });
  const requestedConsultantId = account.role === "admin" ? String(value.consultantAccountId || property.consultantAccountId || "") : property.consultantAccountId || "";
  const consultant = requestedConsultantId ? await activeConsultant(db, requestedConsultantId, property.agencyId) : null;
  if (requestedConsultantId && !consultant) return Response.json({ ok: false, error: "CONSULTANT_NOT_AVAILABLE" }, { status: 400 });
  const id = `V-${crypto.randomUUID()}`, timestamp = new Date();
  await db.insert(visits).values({ id, propertyId: property.id, customerAccountId, consultantAccountId: consultant?.id || null, scheduledAt, status: "requested", createdAt: timestamp, updatedAt: timestamp });
  await createWorkflowConversation(db, "visit", id, property.id, property.agencyId, customerAccountId, consultant?.id || null, timestamp);
  await replaceWorkflowReminders(db, "visit", id, scheduledAt, [customerAccountId, consultant?.id], timestamp);
  await notifyWorkflow(db, [customerAccountId], "visit_requested", "درخواست بازدید ثبت شد", `درخواست بازدید «${property.title}» ثبت شد.`, "/panel", timestamp);
  await notifyWorkflow(db, consultant ? [consultant.id] : [], "visit_assigned", "بازدید جدید", `بازدید «${property.title}» برای شما ثبت شد.`, "/consultant", timestamp);
  await writeAudit(db, account, "visit.created", "visit", id, "درخواست بازدید ملک ثبت شد.", { propertyId: property.id, customerAccountId, consultantAccountId: consultant?.id || null, scheduledAt: scheduledAt.toISOString() });
  return Response.json({ ok: true, id, status: "requested" }, { status: 201 });
}

export async function PATCH(request: Request) {
  const account = await getRequestAccount(request);
  if (!account || account.status !== "active") return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  const value = await request.json() as { id?: string; status?: string; scheduledAt?: string; consultantAccountId?: string | null };
  const db = getDb(), row = (await db.select().from(visits).where(eq(visits.id, value.id || "")).limit(1))[0];
  if (!row) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  const property = (await db.select().from(properties).where(eq(properties.id, row.propertyId)).limit(1))[0];
  const isCustomer = row.customerAccountId === account.id, isAgency = account.role === "agency" && Boolean(account.agencyId) && property?.agencyId === account.agencyId;
  const isManager = account.role === "admin" || (account.role === "consultant" && row.consultantAccountId === account.id) || isAgency;
  if (!isCustomer && !isManager) return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const requestedStatus = String(value.status || row.status);
  if (!statuses.includes(requestedStatus as typeof statuses[number]) || (isCustomer && !isManager && requestedStatus !== "cancelled")) return Response.json({ ok: false, error: "INVALID_STATUS" }, { status: 400 });
  const scheduledAt = value.scheduledAt ? new Date(value.scheduledAt) : row.scheduledAt;
  if (value.scheduledAt && (!Number.isFinite(scheduledAt.getTime()) || (!["completed", "cancelled"].includes(requestedStatus) && scheduledAt.getTime() < Date.now()))) return Response.json({ ok: false, error: "INVALID_SCHEDULE" }, { status: 400 });
  let consultantAccountId = row.consultantAccountId;
  if (value.consultantAccountId !== undefined) {
    if (!(account.role === "admin" || isAgency)) return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    const requested = String(value.consultantAccountId || "");
    const consultant = requested ? await activeConsultant(db, requested, isAgency ? account.agencyId : property?.agencyId) : null;
    if (requested && !consultant) return Response.json({ ok: false, error: "CONSULTANT_NOT_AVAILABLE" }, { status: 400 });
    consultantAccountId = consultant?.id || null;
  }
  const timestamp = new Date();
  await db.update(visits).set({ status: requestedStatus as typeof row.status, scheduledAt, consultantAccountId, updatedAt: timestamp }).where(eq(visits.id, row.id));
  if (["completed", "cancelled"].includes(requestedStatus)) await cancelWorkflowReminders(db, "visit", row.id); else await replaceWorkflowReminders(db, "visit", row.id, scheduledAt, [row.customerAccountId, consultantAccountId], timestamp);
  const statusLabel = requestedStatus === "confirmed" ? "تأییدشده" : requestedStatus === "completed" ? "انجام‌شده" : requestedStatus === "cancelled" ? "لغوشده" : "درخواست‌شده";
  await notifyWorkflow(db, [row.customerAccountId, consultantAccountId], "visit_status", "وضعیت بازدید تغییر کرد", `وضعیت بازدید «${property?.title || row.propertyId}» به ${statusLabel} تغییر کرد.`, account.role === "user" ? "/consultant" : "/panel", timestamp);
  await writeAudit(db, account, "visit.status_changed", "visit", row.id, "وضعیت یا برنامه بازدید تغییر کرد.", { fromStatus: row.status, toStatus: requestedStatus, fromConsultantAccountId: row.consultantAccountId, consultantAccountId, scheduledAt: scheduledAt.toISOString() });
  return Response.json({ ok: true, id: row.id, status: requestedStatus });
}
