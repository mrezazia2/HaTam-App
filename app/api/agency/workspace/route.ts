import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { accounts, agencyBranches, agencyMembers, contracts, leads, properties } from "../../../../db/schema";
import { writeAudit } from "../../_lib/audit";
import { getRequestAccount } from "../../_lib/authorization";
import { cancelWorkflowReminders, createWorkflowConversation, notifyWorkflow, replaceWorkflowReminders } from "../../_lib/workflow-communications";

export const dynamic = "force-dynamic";

async function agencyAccount(request: Request) {
  const account = await getRequestAccount(request);
  return account?.role === "agency" && account.status === "active" && account.agencyId ? account : null;
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export async function GET(request: Request) {
  const account = await agencyAccount(request);
  if (!account) return Response.json({ ok: false, error: "AGENCY_AUTH_REQUIRED" }, { status: 403 });
  const db = getDb();
  const [memberRows, branchRows, leadRows, contractRows, propertyRows] = await Promise.all([
    db.select({
      id: agencyMembers.id, accountId: agencyMembers.accountId, name: accounts.name,
      mobile: accounts.mobile, title: agencyMembers.title, status: agencyMembers.status,
    }).from(agencyMembers).leftJoin(accounts, eq(agencyMembers.accountId, accounts.id)).where(eq(agencyMembers.agencyId, account.agencyId)),
    db.select().from(agencyBranches).where(eq(agencyBranches.agencyId, account.agencyId)).orderBy(desc(agencyBranches.updatedAt)),
    db.select().from(leads).where(eq(leads.agencyId, account.agencyId)).orderBy(desc(leads.updatedAt)),
    db.select().from(contracts).where(eq(contracts.agencyId, account.agencyId)).orderBy(desc(contracts.updatedAt)),
    db.select().from(properties).where(eq(properties.agencyId, account.agencyId)).orderBy(desc(properties.updatedAt)),
  ]);
  return Response.json({ ok: true, members: memberRows, branches: branchRows, leads: leadRows, contracts: contractRows, properties: propertyRows });
}

export async function POST(request: Request) {
  const account = await agencyAccount(request);
  if (!account) return Response.json({ ok: false, error: "AGENCY_AUTH_REQUIRED" }, { status: 403 });
  const body = (await request.json()) as { resource?: string; payload?: Record<string, unknown> };
  const value = body.payload ?? {};
  const db = getDb();
  const timestamp = new Date();

  if (body.resource === "branches") {
    const name = clean(value.name), address = clean(value.address), phone = clean(value.phone);
    const status = value.status === "suspended" ? "suspended" : "active";
    if (name.length < 2 || !address || phone.length > 30) return Response.json({ ok: false, error: "INVALID_BRANCH" }, { status: 400 });
    const requestedId = clean(value.id), id = requestedId || `BR-${crypto.randomUUID()}`;
    if (requestedId) {
      const existing = (await db.select().from(agencyBranches).where(eq(agencyBranches.id, requestedId)).limit(1))[0];
      if (!existing || existing.agencyId !== account.agencyId) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      await db.update(agencyBranches).set({ name, phone, address, status, updatedAt: timestamp }).where(and(eq(agencyBranches.id, id), eq(agencyBranches.agencyId, account.agencyId)));
    } else {
      await db.insert(agencyBranches).values({ id, agencyId: account.agencyId, name, phone, address, status, createdAt: timestamp, updatedAt: timestamp });
    }
    await writeAudit(db, account, "agency.branch_saved", "agency_branch", id, "اطلاعات شعبه آژانس ذخیره شد.", { name, status });
    return Response.json({ ok: true, id });
  }

  if (body.resource === "leads") {
    const name = clean(value.name), mobile = clean(value.mobile), requestText = clean(value.request);
    const statuses = ["new", "contacted", "qualified", "won", "lost"] as const;
    const status = statuses.includes(value.status as (typeof statuses)[number]) ? value.status as (typeof statuses)[number] : "new";
    if (name.length < 2 || mobile.length < 10 || !requestText) return Response.json({ ok: false, error: "INVALID_LEAD" }, { status: 400 });
    const requestedId = clean(value.id), id = requestedId || `L-${crypto.randomUUID()}`;
    const consultantAccountId = clean(value.consultantAccountId) || null;
    if (consultantAccountId) {
      const member = (await db.select().from(agencyMembers).where(and(eq(agencyMembers.agencyId, account.agencyId), eq(agencyMembers.accountId, consultantAccountId), eq(agencyMembers.status, "active"))).limit(1))[0];
      if (!member) return Response.json({ ok: false, error: "CONSULTANT_NOT_IN_AGENCY" }, { status: 400 });
    }
    if (requestedId) {
      const existing = (await db.select().from(leads).where(eq(leads.id, requestedId)).limit(1))[0];
      if (!existing || existing.agencyId !== account.agencyId) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      await db.update(leads).set({ name, mobile, request: requestText, consultantAccountId, status, updatedAt: timestamp }).where(and(eq(leads.id, id), eq(leads.agencyId, account.agencyId)));
    } else {
      await db.insert(leads).values({ id, agencyId: account.agencyId, consultantAccountId, name, mobile, request: requestText, status, createdAt: timestamp, updatedAt: timestamp });
    }
    await writeAudit(db, account, "agency.lead_saved", "lead", id, "درخواست مشتری آژانس ذخیره شد.", { status });
    return Response.json({ ok: true, id });
  }

  if (body.resource === "contracts") {
    const customerName = clean(value.customerName), amount = Number(value.amount) || 0;
    const statuses = ["draft", "review", "signing", "completed", "cancelled"] as const;
    const status = statuses.includes(value.status as (typeof statuses)[number]) ? value.status as (typeof statuses)[number] : "draft";
    const customerMobile = clean(value.customerMobile).replace(/\D/g, "");
    const signingAt = value.signingAt ? new Date(String(value.signingAt)) : null;
    if (customerName.length < 2 || amount < 0 || (customerMobile && customerMobile.length !== 11) || (signingAt && !Number.isFinite(signingAt.getTime()))) return Response.json({ ok: false, error: "INVALID_CONTRACT" }, { status: 400 });
    const requestedId = clean(value.id), id = requestedId || `CTR-${crypto.randomUUID()}`;
    const propertyId = clean(value.propertyId) || null, consultantAccountId = clean(value.consultantAccountId) || null;
    const customer = customerMobile ? (await db.select().from(accounts).where(and(eq(accounts.mobile, customerMobile), eq(accounts.role, "user"), eq(accounts.status, "active"))).limit(1))[0] : null;
    if (propertyId) {
      const property = (await db.select({ id: properties.id }).from(properties).where(and(eq(properties.id, propertyId), eq(properties.agencyId, account.agencyId))).limit(1))[0];
      if (!property) return Response.json({ ok: false, error: "PROPERTY_NOT_IN_AGENCY" }, { status: 400 });
    }
    if (consultantAccountId) {
      const member = (await db.select().from(agencyMembers).where(and(eq(agencyMembers.agencyId, account.agencyId), eq(agencyMembers.accountId, consultantAccountId), eq(agencyMembers.status, "active"))).limit(1))[0];
      if (!member) return Response.json({ ok: false, error: "CONSULTANT_NOT_IN_AGENCY" }, { status: 400 });
    }
    if (requestedId) {
      const existing = (await db.select().from(contracts).where(eq(contracts.id, requestedId)).limit(1))[0];
      if (!existing || existing.agencyId !== account.agencyId) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      await db.update(contracts).set({ customerName, customerMobile, customerAccountId: customer?.id || null, amount, propertyId, consultantAccountId, signingAt, notes: clean(value.notes).slice(0, 4000), status, updatedAt: timestamp }).where(and(eq(contracts.id, id), eq(contracts.agencyId, account.agencyId)));
    } else {
      await db.insert(contracts).values({ id, agencyId: account.agencyId, propertyId, consultantAccountId, customerAccountId: customer?.id || null, customerName, customerMobile, amount, signingAt, notes: clean(value.notes).slice(0, 4000), status, createdAt: timestamp, updatedAt: timestamp });
    }
    if (customer?.id && consultantAccountId) await createWorkflowConversation(db, "contract", id, propertyId, account.agencyId, customer.id, consultantAccountId, timestamp);
    const recipients = [customer?.id, consultantAccountId];
    if (["completed", "cancelled"].includes(status)) await cancelWorkflowReminders(db, "contract", id); else await replaceWorkflowReminders(db, "contract", id, signingAt, recipients, timestamp);
    await notifyWorkflow(db, recipients, "contract_status", "قرارداد به‌روزرسانی شد", `وضعیت قرارداد ${id} به «${status === "draft" ? "پیش‌نویس" : status === "review" ? "در بررسی" : status === "signing" ? "در حال امضا" : status === "completed" ? "تکمیل‌شده" : "لغوشده"}» تغییر کرد.`, account.role === "agency" ? "/panel" : "/agency", timestamp);
    await writeAudit(db, account, "agency.contract_saved", "contract", id, "قرارداد آژانس ذخیره شد.", { status, amount, signingAt: signingAt?.toISOString() || null, customerAccountId: customer?.id || null, consultantAccountId });
    return Response.json({ ok: true, id });
  }

  if (body.resource === "members") {
    const consultant = (await db.select().from(accounts).where(eq(accounts.mobile, clean(value.mobile))).limit(1))[0];
    if (!consultant || consultant.role !== "consultant") return Response.json({ ok: false, error: "CONSULTANT_NOT_FOUND" }, { status: 404 });
    if (consultant.agencyId && consultant.agencyId !== account.agencyId) return Response.json({ ok: false, error: "CONSULTANT_IN_ANOTHER_AGENCY" }, { status: 409 });
    const statuses = ["invited", "active", "suspended"] as const;
    const status = statuses.includes(value.status as (typeof statuses)[number]) ? value.status as (typeof statuses)[number] : "invited";
    const requestedId = clean(value.id), id = requestedId || `AM-${crypto.randomUUID()}`;
    const title = clean(value.title) || "مشاور";
    if (requestedId) {
      const existing = (await db.select().from(agencyMembers).where(eq(agencyMembers.id, requestedId)).limit(1))[0];
      if (!existing || existing.agencyId !== account.agencyId) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      await db.update(agencyMembers).set({ accountId: consultant.id, title, status, updatedAt: timestamp }).where(and(eq(agencyMembers.id, id), eq(agencyMembers.agencyId, account.agencyId)));
    } else {
      await db.insert(agencyMembers).values({ id, agencyId: account.agencyId, accountId: consultant.id, title, status, createdAt: timestamp, updatedAt: timestamp });
    }
    await db.update(accounts).set({ agencyId: account.agencyId, updatedAt: timestamp }).where(eq(accounts.id, consultant.id));
    await writeAudit(db, account, "agency.member_saved", "agency_member", id, "عضو آژانس ذخیره شد.", { consultantAccountId: consultant.id, status });
    return Response.json({ ok: true, id });
  }

  if (body.resource === "assign-property") {
    const propertyId = clean(value.propertyId);
    const property = (await db.select().from(properties).where(and(eq(properties.id, propertyId), eq(properties.agencyId, account.agencyId))).limit(1))[0];
    if (!property) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    const consultantAccountId = clean(value.consultantAccountId) || null;
    if (consultantAccountId) {
      const member = (await db.select().from(agencyMembers).where(and(eq(agencyMembers.agencyId, account.agencyId), eq(agencyMembers.accountId, consultantAccountId), eq(agencyMembers.status, "active"))).limit(1))[0];
      if (!member) return Response.json({ ok: false, error: "CONSULTANT_NOT_IN_AGENCY" }, { status: 400 });
    }
    await db.update(properties).set({ consultantAccountId, updatedAt: timestamp }).where(and(eq(properties.id, propertyId), eq(properties.agencyId, account.agencyId)));
    await writeAudit(db, account, "agency.property_assigned", "property", propertyId, "فایل ملک به مشاور تخصیص داده شد.", { consultantAccountId });
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false, error: "INVALID_RESOURCE" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const account = await agencyAccount(request);
  if (!account) return Response.json({ ok: false, error: "AGENCY_AUTH_REQUIRED" }, { status: 403 });
  const url = new URL(request.url), resource = url.searchParams.get("resource"), id = url.searchParams.get("id") || "";
  if (!id || !["branches", "leads", "contracts", "members"].includes(resource || "")) return Response.json({ ok: false, error: "INVALID_RESOURCE" }, { status: 400 });
  const db = getDb();

  if (resource === "branches") {
    const row = (await db.select().from(agencyBranches).where(and(eq(agencyBranches.id, id), eq(agencyBranches.agencyId, account.agencyId))).limit(1))[0];
    if (!row) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    await db.delete(agencyBranches).where(and(eq(agencyBranches.id, id), eq(agencyBranches.agencyId, account.agencyId)));
    await writeAudit(db, account, "agency.branch_deleted", "agency_branch", id, "شعبه آژانس حذف شد.", { name: row.name });
  } else if (resource === "leads") {
    const row = (await db.select().from(leads).where(and(eq(leads.id, id), eq(leads.agencyId, account.agencyId))).limit(1))[0];
    if (!row) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    await db.delete(leads).where(and(eq(leads.id, id), eq(leads.agencyId, account.agencyId)));
    await writeAudit(db, account, "agency.lead_deleted", "lead", id, "درخواست مشتری آژانس حذف شد.", { name: row.name });
  } else if (resource === "contracts") {
    const row = (await db.select().from(contracts).where(and(eq(contracts.id, id), eq(contracts.agencyId, account.agencyId))).limit(1))[0];
    if (!row) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    await db.update(contracts).set({ status: "cancelled", updatedAt: new Date() }).where(and(eq(contracts.id, id), eq(contracts.agencyId, account.agencyId)));
    await cancelWorkflowReminders(db, "contract", id);
    await writeAudit(db, account, "agency.contract_cancelled", "contract", id, "قرارداد آژانس لغو و بایگانی شد.", { customerName: row.customerName });
  } else if (resource === "members") {
    const row = (await db.select().from(agencyMembers).where(and(eq(agencyMembers.id, id), eq(agencyMembers.agencyId, account.agencyId))).limit(1))[0];
    if (!row) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    await db.delete(agencyMembers).where(and(eq(agencyMembers.id, id), eq(agencyMembers.agencyId, account.agencyId)));
    await db.update(accounts).set({ agencyId: null, updatedAt: new Date() }).where(and(eq(accounts.id, row.accountId), eq(accounts.agencyId, account.agencyId)));
    await writeAudit(db, account, "agency.member_deleted", "agency_member", id, "عضو از آژانس حذف شد.", { consultantAccountId: row.accountId });
  }
  return Response.json({ ok: true });
}
