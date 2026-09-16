"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import "./page.css";
import "./loading.css";

type Kind = "customer" | "consultant" | "agency" | "property" | "request";
type Option = { id: string; name?: string; title?: string; mobile?: string; phone?: string };
type Data = { customers: Option[]; consultants: Option[]; agencies: Option[]; properties: Option[]; requests: unknown[] };
const kinds: [Kind, string][] = [["customer", "مشتری"], ["consultant", "مشاور"], ["agency", "آژانس"], ["property", "ملک"], ["request", "درخواست خرید/فروش"]];
const empty: Record<Kind, Record<string, string>> = {
  customer: { name: "", mobile: "", address: "", nationalId: "" },
  consultant: { name: "", mobile: "", address: "", nationalId: "", agencyId: "" },
  agency: { name: "", mobile: "", address: "", licenseNumber: "", managerAccountId: "" },
  property: { title: "", ownerMobile: "", ownerAccountId: "", consultantAccountId: "", agencyId: "", address: "", district: "", transactionType: "sale", propertyType: "apartment", area: "", bedrooms: "", price: "", latitude: "", longitude: "", description: "" },
  request: { requestType: "buy", customerAccountId: "", consultantAccountId: "", propertyId: "", title: "", district: "", minBudget: "", maxBudget: "", description: "" },
};

export default function CreateCenter() {
  const [kind, setKind] = useState<Kind>("customer");
  const [form, setForm] = useState({ ...empty.customer });
  const [data, setData] = useState<Data>({ customers: [], consultants: [], agencies: [], properties: [], requests: [] });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await fetch("/api/admin/create-center", { cache: "no-store" });
      const result = await response.json().catch(() => ({ message: "پاسخ نامعتبر از سرور دریافت شد." }));
      if (!response.ok) throw new Error(result.message || "دریافت رکوردها انجام نشد.");
      setData(result);
    } catch (error) { setNotice(error instanceof Error ? error.message : "ارتباط با سرور برقرار نشد."); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("kind") as Kind | null;
    if (requested && Object.hasOwn(empty, requested)) { setKind(requested); setForm({ ...empty[requested] }); }
    void load();
  }, []);
  const changeKind = (next: Kind) => { setKind(next); setForm({ ...empty[next] }); setNotice(""); window.history.replaceState(null, "", `/admin/create?kind=${next}`); };
  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return; setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/admin/create-center", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, ...form }) });
      const result = await response.json().catch(() => ({ message: "پاسخ نامعتبر از سرور دریافت شد." }));
      if (!response.ok) throw new Error(result.message || "ثبت رکورد انجام نشد.");
      setNotice(`رکورد با موفقیت ثبت شد. شناسه: ${result.id}`); setForm({ ...empty[kind] }); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "ارتباط با سرور برقرار نشد."); }
    finally { setBusy(false); }
  };

  return <main className="create-center" dir="rtl">
    <header><div><span>مرکز ثبت ادمین</span><h1>افزودن رکورد و درخواست</h1><p>اطلاعات پس از اعتبارسنجی مستقیماً در پایگاه داده و دفتر لاگ ثبت می‌شود.</p></div><Link href="/admin">بازگشت به پنل</Link></header>
    <nav>{kinds.map(([key, label]) => <button type="button" className={kind === key ? "active" : ""} onClick={() => changeKind(key)} key={key}>{label}</button>)}</nav>
    {loading ? <div className="create-loading" role="status">در حال آماده‌سازی فرم…</div> : <form onSubmit={save} aria-busy={busy}>
      <h2>{kind === "request" ? "ثبت درخواست برای مشتری مشخص" : `ثبت ${kinds.find(item => item[0] === kind)?.[1]} جدید`}</h2>
      {kind === "customer" && <><Field label="نام و نام خانوادگی" value={form.name} set={v => set("name", v)} required/><Field label="شماره موبایل" value={form.mobile} set={v => set("mobile", v)} mobile required/><Field label="کد ملی" value={form.nationalId} set={v => set("nationalId", v)} numeric/><Area label="آدرس" value={form.address} set={v => set("address", v)} required/></>}
      {kind === "consultant" && <><Field label="نام و نام خانوادگی" value={form.name} set={v => set("name", v)} required/><Field label="شماره موبایل" value={form.mobile} set={v => set("mobile", v)} mobile required/><Field label="کد ملی" value={form.nationalId} set={v => set("nationalId", v)} numeric/><Select label="آژانس مربوطه" value={form.agencyId} set={v => set("agencyId", v)} items={data.agencies}/><Area label="آدرس" value={form.address} set={v => set("address", v)} required/></>}
      {kind === "agency" && <><Field label="نام آژانس" value={form.name} set={v => set("name", v)} required/><Field label="شماره دفتر یا موبایل" value={form.mobile} set={v => set("mobile", v)} phone required/><Field label="شماره مجوز" value={form.licenseNumber} set={v => set("licenseNumber", v)} numeric/><Select label="مدیر یا مشاور مسئول" value={form.managerAccountId} set={v => set("managerAccountId", v)} items={data.consultants}/><Area label="آدرس دفتر" value={form.address} set={v => set("address", v)} required/></>}
      {kind === "property" && <><Field label="عنوان ملک" value={form.title} set={v => set("title", v)} required/><Select label="مالک ثبت‌شده" value={form.ownerAccountId} set={v => { set("ownerAccountId", v); const owner = data.customers.find(x => x.id === v); if (owner?.mobile) set("ownerMobile", owner.mobile); }} items={data.customers}/><Field label="موبایل مالک" value={form.ownerMobile} set={v => set("ownerMobile", v)} mobile required/><Select label="مشاور مسئول" value={form.consultantAccountId} set={v => set("consultantAccountId", v)} items={data.consultants}/><Select label="آژانس" value={form.agencyId} set={v => set("agencyId", v)} items={data.agencies}/><Field label="منطقه یا محله" value={form.district} set={v => set("district", v)}/><Choice label="نوع معامله" value={form.transactionType} set={v => set("transactionType", v)} options={[["sale", "فروش"], ["rent", "اجاره"], ["presale", "پیش‌فروش"]]}/><Choice label="نوع ملک" value={form.propertyType} set={v => set("propertyType", v)} options={[["apartment", "آپارتمان"], ["villa", "ویلا"], ["land", "زمین"], ["commercial", "تجاری"]]}/><Field label="متراژ" value={form.area} set={v => set("area", v)} numeric required/><Field label="تعداد خواب" value={form.bedrooms} set={v => set("bedrooms", v)} numeric/><Field label="قیمت (تومان)" value={form.price} set={v => set("price", v)} numeric required/><Field label="عرض جغرافیایی" value={form.latitude} set={v => set("latitude", v)}/><Field label="طول جغرافیایی" value={form.longitude} set={v => set("longitude", v)}/><Area label="آدرس کامل" value={form.address} set={v => set("address", v)} required/><Area label="توضیحات" value={form.description} set={v => set("description", v)}/></>}
      {kind === "request" && <><Choice label="نوع درخواست" value={form.requestType} set={v => set("requestType", v)} options={[["buy", "خرید"], ["sell", "فروش"]]}/><Select label="مشتری" value={form.customerAccountId} set={v => set("customerAccountId", v)} items={data.customers} required/><Select label="مشاور مسئول" value={form.consultantAccountId} set={v => set("consultantAccountId", v)} items={data.consultants}/><Select label="ملک مرتبط (اختیاری)" value={form.propertyId} set={v => set("propertyId", v)} items={data.properties}/><Field label="عنوان درخواست" value={form.title} set={v => set("title", v)} required/><Field label="منطقه یا محله" value={form.district} set={v => set("district", v)}/><Field label="حداقل بودجه (تومان)" value={form.minBudget} set={v => set("minBudget", v)} numeric/><Field label="حداکثر بودجه (تومان)" value={form.maxBudget} set={v => set("maxBudget", v)} numeric/><Area label="شرح نیاز مشتری" value={form.description} set={v => set("description", v)}/></>}
      <footer><button disabled={busy} type="submit">{busy ? "در حال ثبت…" : "ثبت نهایی"}</button></footer>
    </form>}
    {notice && <div className="create-notice" role="status">{notice}</div>}
  </main>;
}

function normalizeDigits(value: string) { return value.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))); }
function Field({ label, value, set, required, numeric, mobile, phone }: { label: string; value: string; set: (v: string) => void; required?: boolean; numeric?: boolean; mobile?: boolean; phone?: boolean }) { const clean = (input: string) => numeric ? normalizeDigits(input).replace(/\D/g, "") : mobile || phone ? normalizeDigits(input).replace(/[^\d+\-() ]/g, "") : input; return <label><span>{label}</span><input required={required} inputMode={numeric || mobile || phone ? "numeric" : undefined} value={value} onChange={e => set(clean(e.target.value))} placeholder={mobile ? "09120000000" : undefined}/></label>; }
function Area({ label, value, set, required }: { label: string; value: string; set: (v: string) => void; required?: boolean }) { return <label className="wide"><span>{label}</span><textarea required={required} value={value} onChange={e => set(e.target.value)}/></label>; }
function Select({ label, value, set, items, required }: { label: string; value: string; set: (v: string) => void; items: Option[]; required?: boolean }) { return <label><span>{label}</span><select required={required} value={value} onChange={e => set(e.target.value)}><option value="">انتخاب کنید</option>{items.map(x => <option value={x.id} key={x.id}>{x.name || x.title} {x.mobile || x.phone ? `— ${x.mobile || x.phone}` : ""}</option>)}</select></label>; }
function Choice({ label, value, set, options }: { label: string; value: string; set: (v: string) => void; options: string[][] }) { return <label><span>{label}</span><select value={value} onChange={e => set(e.target.value)}>{options.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>; }
