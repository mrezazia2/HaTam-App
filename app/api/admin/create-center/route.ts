import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { accounts, agencies, properties, propertyRequests } from "../../../../db/schema";
import { forbidden, requireAdmin } from "../../_lib/authorization";
import { writeAudit } from "../../_lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await requireAdmin(request)) return forbidden();
  try {
    const db = getDb();
    const [people, agencyRows, propertyRows, requests] = await Promise.all([db.select().from(accounts), db.select().from(agencies), db.select().from(properties), db.select().from(propertyRequests).orderBy(desc(propertyRequests.createdAt)).limit(100)]);
    return Response.json({ ok: true, customers: people.filter(x => x.role === "user"), consultants: people.filter(x => x.role === "consultant"), agencies: agencyRows, properties: propertyRows, requests });
  } catch (error) { return serverError(error); }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return forbidden();
  try {
    const value = await request.json() as Record<string, unknown>, kind = req(value.kind), db = getDb(), now = new Date();
    if (kind === "customer" || kind === "consultant") {
      const name = req(value.name), mobile = normalizeMobile(value.mobile), address = req(value.address);
      if (!name || !mobile || !address) return invalid("نام، شماره موبایل ۱۱ رقمی و آدرس الزامی است.");
      if ((await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.mobile, mobile)).limit(1))[0]) return conflict("این شماره موبایل قبلاً ثبت شده است.");
      const agencyId = opt(value.agencyId);
      if (kind === "consultant" && agencyId && !(await existsAgency(agencyId))) return invalid("آژانس انتخاب‌شده معتبر نیست.");
      const id = `${kind === "customer" ? "U" : "C"}-${crypto.randomUUID()}`;
      await db.insert(accounts).values({ id, role: kind === "customer" ? "user" : "consultant", name, mobile, address, nationalId: normalizeDigits(opt(value.nationalId) || "") || null, agencyId, status: "active", createdAt: now, updatedAt: now });
      await writeAudit(db, admin, `${kind}.create`, kind, id, `${kind === "customer" ? "مشتری" : "مشاور"} جدید توسط ادمین ثبت شد.`, { name, mobile: mask(mobile) });
      return Response.json({ ok: true, id }, { status: 201 });
    }
    if (kind === "agency") {
      const name = req(value.name), phone = normalizePhone(value.mobile), address = req(value.address), managerAccountId = opt(value.managerAccountId);
      if (!name || !phone || !address) return invalid("نام، شماره تماس معتبر و آدرس آژانس الزامی است.");
      if (managerAccountId && !(await existsAccount(managerAccountId, "consultant"))) return invalid("مدیر یا مشاور مسئول معتبر نیست.");
      const id = `A-${crypto.randomUUID()}`;
      await db.insert(agencies).values({ id, name, phone, address, licenseNumber: normalizeDigits(opt(value.licenseNumber) || "") || null, managerAccountId, status: "active", createdAt: now, updatedAt: now });
      await writeAudit(db, admin, "agency.create", "agency", id, "آژانس جدید توسط ادمین ثبت شد.", { name, phone: mask(phone) });
      return Response.json({ ok: true, id }, { status: 201 });
    }
    if (kind === "property") {
      const title = req(value.title), ownerMobile = normalizeMobile(value.ownerMobile), address = req(value.address), ownerAccountId = opt(value.ownerAccountId), consultantAccountId = opt(value.consultantAccountId), agencyId = opt(value.agencyId);
      if (!title || !ownerMobile || !address) return invalid("عنوان، شماره موبایل ۱۱ رقمی مالک و آدرس ملک الزامی است.");
      if (ownerAccountId && !(await existsAccount(ownerAccountId, "user"))) return invalid("مالک انتخاب‌شده معتبر نیست.");
      if (consultantAccountId && !(await existsAccount(consultantAccountId, "consultant"))) return invalid("مشاور انتخاب‌شده معتبر نیست.");
      if (agencyId && !(await existsAgency(agencyId))) return invalid("آژانس انتخاب‌شده معتبر نیست.");
      const id = `HT-${crypto.randomUUID()}`;
      await db.insert(properties).values({ id, title, ownerAccountId, consultantAccountId, agencyId, ownerMobile, address, district: opt(value.district), latitude: numNull(value.latitude), longitude: numNull(value.longitude), transactionType: value.transactionType === "rent" ? "rent" : value.transactionType === "presale" ? "presale" : "sale", propertyType: req(value.propertyType) || "apartment", area: num(value.area), bedrooms: num(value.bedrooms), price: num(value.price), description: opt(value.description) || "", coverImage: null, status: "pending", featured: false, createdAt: now, updatedAt: now });
      await writeAudit(db, admin, "property.create", "property", id, "ملک جدید توسط ادمین ثبت شد.", { title, ownerAccountId, consultantAccountId });
      return Response.json({ ok: true, id }, { status: 201 });
    }
    if (kind === "request") {
      const requestType = value.requestType === "sell" ? "sell" : "buy", customerAccountId = req(value.customerAccountId), title = req(value.title), consultantAccountId = opt(value.consultantAccountId), propertyId = opt(value.propertyId);
      if (!customerAccountId || !title) return invalid("انتخاب مشتری و عنوان درخواست الزامی است.");
      const customer = (await db.select().from(accounts).where(eq(accounts.id, customerAccountId)).limit(1))[0];
      if (!customer || customer.role !== "user") return invalid("مشتری انتخاب‌شده معتبر نیست.");
      if (consultantAccountId && !(await existsAccount(consultantAccountId, "consultant"))) return invalid("مشاور انتخاب‌شده معتبر نیست.");
      if (propertyId && !(await existsProperty(propertyId))) return invalid("ملک انتخاب‌شده معتبر نیست.");
      const id = `REQ-${crypto.randomUUID()}`;
      await db.insert(propertyRequests).values({ id, requestType, customerAccountId, consultantAccountId, propertyId, title, district: opt(value.district), minBudget: numNull(value.minBudget), maxBudget: numNull(value.maxBudget), description: opt(value.description) || "", status: consultantAccountId ? "assigned" : "new", createdBy: admin.id, createdAt: now, updatedAt: now });
      await writeAudit(db, admin, "property_request.create", "property_request", id, `درخواست ${requestType === "buy" ? "خرید" : "فروش"} برای ${customer.name} ثبت شد.`, { customerAccountId, consultantAccountId, propertyId });
      return Response.json({ ok: true, id }, { status: 201 });
    }
    return invalid("نوع رکورد معتبر نیست.");
  } catch (error) { return serverError(error); }
}

async function existsAccount(id: string, role: "user" | "consultant") { const row = (await getDb().select({ role: accounts.role }).from(accounts).where(eq(accounts.id, id)).limit(1))[0]; return row?.role === role; }
async function existsAgency(id: string) { return Boolean((await getDb().select({ id: agencies.id }).from(agencies).where(eq(agencies.id, id)).limit(1))[0]); }
async function existsProperty(id: string) { return Boolean((await getDb().select({ id: properties.id }).from(properties).where(eq(properties.id, id)).limit(1))[0]); }
function req(v: unknown) { return String(v ?? "").trim(); }
function opt(v: unknown) { return req(v) || null; }
function normalizeDigits(value: string) { return value.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))); }
function numericText(v: unknown) { return normalizeDigits(req(v)).replace(/[٬،,\s]/g, ""); }
function num(v: unknown) { return Math.max(0, Number(numericText(v)) || 0); }
function numNull(v: unknown) { const raw = numericText(v), n = Number(raw); return raw !== "" && Number.isFinite(n) ? n : null; }
function normalizePhone(v: unknown) { const value = normalizeDigits(req(v)).replace(/[^\d+]/g, "").replace(/^\+98(?=9)/, "0").replace(/^98(?=9)/, "0"); return /^0\d{9,10}$/.test(value) ? value : ""; }
function normalizeMobile(v: unknown) { const value = normalizePhone(v); return /^09\d{9}$/.test(value) ? value : ""; }
function mask(v: string) { return v.length > 8 ? `${v.slice(0, 4)}***${v.slice(-4)}` : "***"; }
function invalid(message: string) { return Response.json({ ok: false, message }, { status: 400 }); }
function conflict(message: string) { return Response.json({ ok: false, message }, { status: 409 }); }
function serverError(error: unknown) { console.error("create-center error", error); return Response.json({ ok: false, message: "خطای پایگاه داده رخ داد؛ دوباره تلاش کنید." }, { status: 500 }); }
