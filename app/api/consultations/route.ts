import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { accounts, agencyMembers, consultations, properties } from "../../../db/schema";
import { writeAudit } from "../_lib/audit";
import { getRequestAccount } from "../_lib/authorization";
import {hasVipAccess} from '../_lib/vip-access';
import {validateValuation,valuationNotes,type ValuationInput} from '../../mobile/valuation-validation';
import { cancelWorkflowReminders, createWorkflowConversation, notifyWorkflow, replaceWorkflowReminders } from "../_lib/workflow-communications";

export const dynamic = "force-dynamic";
const statuses = ["requested", "scheduled", "completed", "cancelled"] as const;

async function activeConsultant(db: ReturnType<typeof getDb>, id: string, agencyId?: string | null) {
  const consultant = (await db.select().from(accounts).where(and(eq(accounts.id, id), eq(accounts.role, "consultant"), eq(accounts.status, "active"))).limit(1))[0];
  if (!consultant || (agencyId && consultant.agencyId !== agencyId)) return null;
  return consultant;
}

export async function GET(request: Request) {
  const account = await getRequestAccount(request);
  if (!account || account.status !== "active") return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  const db = getDb(), rows = await db.select().from(consultations).orderBy(desc(consultations.updatedAt));
  const propertyIds = [...new Set(rows.map(row => row.propertyId).filter(Boolean) as string[])];
  const propertyRows = propertyIds.length ? await db.select({ id: properties.id, title: properties.title, agencyId: properties.agencyId }).from(properties).where(inArray(properties.id, propertyIds)) : [];
  const propertyMap = new Map(propertyRows.map(property => [property.id, property]));
  const scoped = rows.filter(row => account.role === "admin" || (account.role === "user" && row.customerAccountId === account.id) || (account.role === "consultant" && row.consultantAccountId === account.id) || (account.role === "agency" && account.agencyId && row.propertyId && propertyMap.get(row.propertyId)?.agencyId === account.agencyId));
  const accountIds = [...new Set(scoped.flatMap(row => [row.customerAccountId, row.consultantAccountId]).filter(Boolean) as string[])];
  const people = accountIds.length ? await db.select({ id: accounts.id, name: accounts.name, mobile: accounts.mobile }).from(accounts).where(inArray(accounts.id, accountIds)) : [];
  const names = new Map(people.map(person => [person.id, person]));
  const options = account.role === "agency" && account.agencyId
    ? await db.select({ id: accounts.id, name: accounts.name }).from(agencyMembers).innerJoin(accounts, eq(agencyMembers.accountId, accounts.id)).where(and(eq(agencyMembers.agencyId, account.agencyId), eq(agencyMembers.status, "active"), eq(accounts.status, "active")))
    : account.role === "admin" ? await db.select({ id: accounts.id, name: accounts.name }).from(accounts).where(and(eq(accounts.role, "consultant"), eq(accounts.status, "active"))) : [];
  return Response.json({ ok: true, items: scoped.map(row => ({ ...row, propertyTitle: row.propertyId ? propertyMap.get(row.propertyId)?.title || null : null, customerName: names.get(row.customerAccountId)?.name || "کاربر", customerMobile: names.get(row.customerAccountId)?.mobile || "", consultantName: row.consultantAccountId ? names.get(row.consultantAccountId)?.name || "مشاور" : null })), consultants: options });
}

export async function POST(request: Request) {
  const account = await getRequestAccount(request);
  if (!account || account.status !== "active") return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  if (!["user", "admin"].includes(account.role)) return Response.json({ok:false,error:"CUSTOMER_ROLE_REQUIRED",message:"این فرم مخصوص حساب مشتری است؛ درخواست مشتری را از پنل نقش خود ثبت کنید."},{status:403});
  let value:{propertyId?:string;subject?:string;notes?:string;scheduledAt?:string;customerAccountId?:string;consultantAccountId?:string;kind?:string;valuation?:ValuationInput};
  try{value=await request.json();if(!value||typeof value!=='object'||Array.isArray(value))throw Error()}catch{return Response.json({ok:false,error:'INVALID_REQUEST'},{status:400})}
  if(value.kind==='valuation'){
   const v=value.valuation;
   if(!v||['name','mobile','address','area','year','price'].some(key=>typeof v[key as keyof ValuationInput]!=='string')||!Array.isArray(v.amenities))return Response.json({ok:false,error:'INVALID_VALUATION',message:'مشخصات قیمت‌گذاری کامل نیست.'},{status:400});
   const errors=validateValuation(v);if(Object.keys(errors).length)return Response.json({ok:false,error:'INVALID_VALUATION',message:Object.values(errors)[0],fields:errors},{status:400});
   value.subject='درخواست قیمت‌گذاری ملک';value.notes=valuationNotes(v);
  }
  const db = getDb(), property = value.propertyId ? (await db.select().from(properties).where(eq(properties.id, value.propertyId)).limit(1))[0] : null;
  if (value.propertyId && (!property || (property.status !== "published" && !(property.status==='vip'&&await hasVipAccess(account))))) return Response.json({ ok: false, error: "PROPERTY_NOT_AVAILABLE" }, { status: 404 });
  const customerAccountId = account.role === "user" ? account.id : String(value.customerAccountId || "");
  if(account.role==="admin"&&!customerAccountId)return Response.json({ok:false,error:"CUSTOMER_REQUIRED",message:"برای ثبت به‌عنوان مدیر، مشتری را از بخش مدیریت درخواست‌ها انتخاب کنید."},{status:400});
  const customer = (await db.select().from(accounts).where(and(eq(accounts.id, customerAccountId), eq(accounts.role, "user"), eq(accounts.status, "active"))).limit(1))[0];
  if (!customer) return Response.json({ ok: false, error: "CUSTOMER_NOT_FOUND" }, { status: 400 });
  const subject = String(value.subject || "مشاوره خرید ملک").trim();
  if (subject.length < 3 || subject.length > 160) return Response.json({ ok: false, error: "INVALID_SUBJECT" }, { status: 400 });
  const scheduledAt = value.scheduledAt ? new Date(value.scheduledAt) : null;
  if (scheduledAt && (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now())) return Response.json({ ok: false, error: "INVALID_SCHEDULE" }, { status: 400 });
  const requestedConsultantId = account.role === "admin" ? String(value.consultantAccountId || property?.consultantAccountId || "") : property?.consultantAccountId || "";
  const consultant = requestedConsultantId ? await activeConsultant(db, requestedConsultantId, property?.agencyId) : null;
  if (requestedConsultantId && !consultant) return Response.json({ ok: false, error: "CONSULTANT_NOT_AVAILABLE" }, { status: 400 });
  const id = `CON-${crypto.randomUUID()}`, timestamp = new Date();
  await db.insert(consultations).values({ id, customerAccountId, consultantAccountId: consultant?.id || null, propertyId: property?.id || null, subject, scheduledAt, status: "requested", notes: String(value.notes || "").slice(0, 4000), createdAt: timestamp, updatedAt: timestamp });
  await createWorkflowConversation(db, "consultation", id, property?.id || null, property?.agencyId || null, customerAccountId, consultant?.id || null, timestamp);
  await replaceWorkflowReminders(db, "consultation", id, scheduledAt, [customerAccountId, consultant?.id], timestamp);
  await notifyWorkflow(db, [customerAccountId], "consultation_requested", "درخواست مشاوره ثبت شد", `درخواست «${subject}» ثبت شد.`, "/panel", timestamp);
  await notifyWorkflow(db, consultant ? [consultant.id] : [], "consultation_assigned", "مشاوره جدید", `مشاوره «${subject}» برای شما ثبت شد.`, "/consultant", timestamp);
  await writeAudit(db, account, "consultation.created", "consultation", id, "درخواست مشاوره ثبت شد.", { propertyId: property?.id || null, customerAccountId, consultantAccountId: consultant?.id || null, scheduledAt: scheduledAt?.toISOString() || null });
  return Response.json({ ok: true, id, status: "requested" }, { status: 201 });
}

export async function PATCH(request: Request) {
  const account = await getRequestAccount(request);
  if (!account || account.status !== "active") return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  const value = await request.json() as { id?: string; status?: string; scheduledAt?: string; notes?: string; consultantAccountId?: string | null };
  const db = getDb(), row = (await db.select().from(consultations).where(eq(consultations.id, value.id || "")).limit(1))[0];
  if (!row) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  const property = row.propertyId ? (await db.select().from(properties).where(eq(properties.id, row.propertyId)).limit(1))[0] : null;
  const isCustomer = row.customerAccountId === account.id, isAgency = account.role === "agency" && Boolean(account.agencyId) && property?.agencyId === account.agencyId;
  const isManager = account.role === "admin" || (account.role === "consultant" && row.consultantAccountId === account.id) || isAgency;
  if (!isCustomer && !isManager) return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const requestedStatus = String(value.status || row.status);
  if (!statuses.includes(requestedStatus as typeof statuses[number]) || (isCustomer && !isManager && requestedStatus !== "cancelled")) return Response.json({ ok: false, error: "INVALID_STATUS" }, { status: 400 });
  const scheduledAt = value.scheduledAt ? new Date(value.scheduledAt) : row.scheduledAt;
  if (value.scheduledAt && (!Number.isFinite(scheduledAt!.getTime()) || (!["completed", "cancelled"].includes(requestedStatus) && scheduledAt!.getTime() < Date.now()))) return Response.json({ ok: false, error: "INVALID_SCHEDULE" }, { status: 400 });
  let consultantAccountId = row.consultantAccountId;
  if (value.consultantAccountId !== undefined) {
    if (!(account.role === "admin" || isAgency)) return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    const requested = String(value.consultantAccountId || "");
    const consultant = requested ? await activeConsultant(db, requested, isAgency ? account.agencyId : property?.agencyId) : null;
    if (requested && !consultant) return Response.json({ ok: false, error: "CONSULTANT_NOT_AVAILABLE" }, { status: 400 });
    consultantAccountId = consultant?.id || null;
  }
  if (requestedStatus === "scheduled" && !scheduledAt) return Response.json({ ok: false, error: "SCHEDULE_REQUIRED" }, { status: 400 });
  const timestamp = new Date(), notes = value.notes === undefined ? row.notes : String(value.notes).slice(0, 4000);
  await db.update(consultations).set({ status: requestedStatus as typeof row.status, scheduledAt, consultantAccountId, notes, updatedAt: timestamp }).where(eq(consultations.id, row.id));
  if (["completed", "cancelled"].includes(requestedStatus)) await cancelWorkflowReminders(db, "consultation", row.id); else await replaceWorkflowReminders(db, "consultation", row.id, scheduledAt, [row.customerAccountId, consultantAccountId], timestamp);
  const statusLabel = requestedStatus === "scheduled" ? "زمان‌بندی‌شده" : requestedStatus === "completed" ? "انجام‌شده" : requestedStatus === "cancelled" ? "لغوشده" : "درخواست‌شده";
  await notifyWorkflow(db, [row.customerAccountId, consultantAccountId], "consultation_status", "وضعیت مشاوره تغییر کرد", `وضعیت مشاوره «${row.subject}» به ${statusLabel} تغییر کرد.`, account.role === "user" ? "/consultant" : "/panel", timestamp);
  await writeAudit(db, account, "consultation.status_changed", "consultation", row.id, "وضعیت یا برنامه مشاوره تغییر کرد.", { fromStatus: row.status, toStatus: requestedStatus, fromConsultantAccountId: row.consultantAccountId, consultantAccountId, scheduledAt: scheduledAt?.toISOString() || null });
  return Response.json({ ok: true, id: row.id, status: requestedStatus });
}
