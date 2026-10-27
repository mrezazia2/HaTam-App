"use client";
import BulkSelection,{SelectionCheckbox,useBulkSelection,bulkFetch} from "../components/BulkSelection";

import { useEffect, useState } from "react";
import { Pencil1Icon, PlusIcon, TrashIcon } from "@radix-ui/react-icons";

type Section = "team" | "leads" | "contracts";
type Member = { createdAt?:string|number; id: string; accountId: string; name: string | null; mobile: string | null; title: string; status: "invited" | "active" | "suspended" };
type Lead = { createdAt?:string|number; id: string; name: string; mobile: string; request: string; consultantAccountId: string | null; status: "new" | "contacted" | "qualified" | "won" | "lost" };
type Contract = { createdAt?:string|number; id: string; customerName: string; customerMobile: string; amount: number; propertyId: string | null; consultantAccountId: string | null; signingAt: string | number | null; notes: string; status: "draft" | "review" | "signing" | "completed" | "cancelled" };
type Property = { id: string; title: string };
type Data = { members: Member[]; leads: Lead[]; contracts: Contract[]; properties: Property[] };
type Form = Record<string, string>;

const empty: Data = { members: [], leads: [], contracts: [], properties: [] };
const labels: Record<string, string> = {
  invited: "دعوت‌شده", active: "فعال", suspended: "تعلیق",
  new: "جدید", contacted: "تماس گرفته شد", qualified: "واجد شرایط", won: "موفق", lost: "از دست رفته",
  draft: "پیش‌نویس", review: "در بررسی", signing: "در حال امضا", completed: "تکمیل‌شده", cancelled: "لغو",
};
const titles: Record<Section, string> = { team: "تیم مشاوران", leads: "سرنخ‌های آژانس", contracts: "قراردادهای آژانس" };
const numericText = (value: string) => value.replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/\D/g, "");
const localDateTime = (value: string | number | null) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

function initialForm(section: Section, row?: Member | Lead | Contract): Form {
  if (!row) {
    return section === "team" ? { status: "invited" } : section === "leads" ? { status: "new" } : { status: "draft" };
  }
  if (section === "team") {
    const member = row as Member;
    return { id: member.id, mobile: member.mobile || "", title: member.title, status: member.status };
  }
  if (section === "leads") {
    const lead = row as Lead;
    return { id: lead.id, name: lead.name, mobile: lead.mobile, request: lead.request, consultantAccountId: lead.consultantAccountId || "", status: lead.status };
  }
  const contract = row as Contract;
  return { id: contract.id, customerName: contract.customerName, customerMobile: contract.customerMobile || "", amount: String(contract.amount), propertyId: contract.propertyId || "", consultantAccountId: contract.consultantAccountId || "", signingAt: localDateTime(contract.signingAt), notes: contract.notes || "", status: contract.status };
}

export default function AgencyWorkspaceView({ section }: { section: Section }) {
  const archive=useArchiveFilter();const selection=useBulkSelection();
  const [data, setData] = useState<Data>(empty);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<Form>(() => initialForm(section));

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/agency/workspace", { headers: { "x-hatam-preview-role": "agency" }, cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setData(body);
    } catch {
      setError("دریافت اطلاعات آژانس انجام نشد.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setOpen(false); setForm(initialForm(section)); setMessage(""); void load(); }, [section]);
  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));
  const startEdit = (row?: Member | Lead | Contract) => { setForm(initialForm(section, row)); setOpen(true); setError(""); setMessage(""); };
  const close = () => { setOpen(false); setForm(initialForm(section)); };

  const save = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    const resource = section === "team" ? "members" : section;
    const payload = section === "contracts" ? { ...form, amount: Number(form.amount || 0), propertyId: form.propertyId || null, consultantAccountId: form.consultantAccountId || null, signingAt: form.signingAt ? new Date(form.signingAt).toISOString() : null } : { ...form, consultantAccountId: form.consultantAccountId || null };
    try {
      const response = await fetch("/api/agency/workspace", {
        method: "POST",
        headers: { "content-type": "application/json", "x-hatam-preview-role": "agency" },
        body: JSON.stringify({ resource, payload }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      close();
      setMessage(form.id ? "ویرایش با موفقیت ذخیره شد." : "رکورد جدید با موفقیت ثبت شد.");
      await load();
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : "";
      setError(code === "CONSULTANT_NOT_FOUND" ? "مشاور فعال با این شماره موبایل پیدا نشد." : code === "INVALID_LEAD" ? "نام، موبایل و شرح درخواست مشتری را کامل کنید." : code === "INVALID_CONTRACT" ? "نام طرف قرارداد و مبلغ معتبر الزامی است." : "ذخیره اطلاعات انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: Member | Lead | Contract) => {
    const name = "name" in row ? row.name : row.customerName;
    if (!window.confirm(`رکورد «${name || row.id}» حذف شود؟`)) return;
    setBusy(true);
    setError("");
    const resource = section === "team" ? "members" : section;
    try {
      const response = await fetch(`/api/agency/workspace?resource=${resource}&id=${encodeURIComponent(row.id)}`, { method: "DELETE", headers: { "x-hatam-preview-role": "agency" } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      if (form.id === row.id) close();
      setMessage("رکورد با موفقیت حذف شد.");
      await load();
    } catch {
      setError("حذف رکورد انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  const allRows: Array<Member | Lead | Contract> = section === "team" ? data.members : section === "leads" ? data.leads : data.contracts;
  const rows=allRows.filter(archive.matches);
  const consultantOptions = data.members.filter(item => item.status !== "suspended");

  return <section className="portal-module agency-live">
    <div className="portal-toolbar">
      <div><strong>{titles[section]}</strong><span> · {rows.length.toLocaleString("fa-IR")} رکورد واقعی</span></div>
      <button className="portal-primary" onClick={() => open ? close() : startEdit()}><PlusIcon />{open ? "بستن فرم" : "افزودن"}</button>
    </div>

    {open && <div className="agency-quick-form agency-record-form">
      {section === "team" && <>
        <label><span>شماره موبایل مشاور</span><input dir="ltr" inputMode="tel" value={form.mobile || ""} onChange={event => set("mobile", numericText(event.target.value).slice(0, 11))} placeholder="09120000000" /></label>
        <label><span>سمت یا عنوان</span><input value={form.title || ""} onChange={event => set("title", event.target.value)} placeholder="مشاور فروش" /></label>
        <label><span>وضعیت عضویت</span><select value={form.status || "invited"} onChange={event => set("status", event.target.value)}><option value="invited">دعوت‌شده</option><option value="active">فعال</option><option value="suspended">تعلیق</option></select></label>
      </>}
      {section === "leads" && <>
        <label><span>نام مشتری</span><input value={form.name || ""} onChange={event => set("name", event.target.value)} placeholder="نام و نام خانوادگی" /></label>
        <label><span>شماره موبایل</span><input dir="ltr" inputMode="tel" value={form.mobile || ""} onChange={event => set("mobile", numericText(event.target.value).slice(0, 11))} placeholder="09120000000" /></label>
        <label><span>وضعیت پیگیری</span><select value={form.status || "new"} onChange={event => set("status", event.target.value)}>{["new", "contacted", "qualified", "won", "lost"].map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label>
        <label className="agency-field-wide"><span>درخواست مشتری</span><textarea value={form.request || ""} onChange={event => set("request", event.target.value)} placeholder="شرح نیاز، منطقه و بودجه مشتری" /></label>
        <label><span>مشاور مسئول</span><select value={form.consultantAccountId || ""} onChange={event => set("consultantAccountId", event.target.value)}><option value="">بدون تخصیص</option>{consultantOptions.map(item => <option key={item.accountId} value={item.accountId}>{item.name || item.mobile}</option>)}</select></label>
      </>}
      {section === "contracts" && <>
        <label><span>نام طرف قرارداد</span><input value={form.customerName || ""} onChange={event => set("customerName", event.target.value)} placeholder="نام و نام خانوادگی" /></label>
        <label><span>موبایل طرف قرارداد</span><input dir="ltr" inputMode="tel" value={form.customerMobile || ""} onChange={event => set("customerMobile", numericText(event.target.value).slice(0, 11))} placeholder="09120000000" /></label>
        <label><span>مبلغ قرارداد (تومان)</span><input inputMode="numeric" value={form.amount ? Number(form.amount).toLocaleString("fa-IR") : ""} onChange={event => set("amount", numericText(event.target.value))} placeholder="۰" /></label>
        <label><span>وضعیت قرارداد</span><select value={form.status || "draft"} onChange={event => set("status", event.target.value)}>{["draft", "review", "signing", "completed", "cancelled"].map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label>
        <label><span>فایل ملک مرتبط</span><select value={form.propertyId || ""} onChange={event => set("propertyId", event.target.value)}><option value="">بدون فایل مرتبط</option>{data.properties.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label><span>مشاور مسئول</span><select value={form.consultantAccountId || ""} onChange={event => set("consultantAccountId", event.target.value)}><option value="">بدون تخصیص</option>{consultantOptions.map(item => <option key={item.accountId} value={item.accountId}>{item.name || item.mobile}</option>)}</select></label>
        <label><span>زمان امضای قرارداد</span><input type="datetime-local" dir="ltr" value={form.signingAt || ""} onChange={event => set("signingAt", event.target.value)} /></label>
        <label className="agency-field-wide"><span>یادداشت و مدارک موردنیاز</span><textarea value={form.notes || ""} onChange={event => set("notes", event.target.value)} placeholder="توضیحات جلسه امضا، مدارک و نکات قرارداد" /></label>
        {form.id && <ContractDocuments contractId={form.id} />}
      </>}
      <div className="agency-form-actions"><button disabled={busy} onClick={save}>{busy ? "در حال ذخیره…" : form.id ? "ذخیره ویرایش" : "ثبت رکورد"}</button><button className="secondary" disabled={busy} onClick={close}>انصراف</button></div>
    </div>}

    {error && <p className="portal-form-error" role="alert">{error}</p>}
    {message && <p className="portal-form-success" role="status">{message}</p>}
    <ArchiveFilters filter={archive} items={allRows}/><BulkSelection ids={rows.map(x=>x.id)} selection={selection} exportRows={rows} actions={(section==="team"?["active","suspended"]:section==="leads"?["new","contacted","qualified","won","lost"]:["draft","review","cancelled"]).map(value=>({value,label:labels[value]||value}))} run={async(id,status)=>{const row=rows.find(x=>x.id===id);if(!row)throw Error();const form=initialForm(section,row);await bulkFetch("/api/agency/workspace","POST",{resource:section==="team"?"members":section,payload:{...form,status,...(section==="contracts"?{amount:Number(form.amount),signingAt:form.signingAt?new Date(form.signingAt).toISOString():null}:{} )}},"agency")}} onDone={load}/>
    <div className="portal-module-card">
      <div className="portal-module-head"><span>عنوان</span><span>جزئیات</span><span>وضعیت</span><span>عملیات</span></div>
      {rows.map(row => {
        const title = "name" in row ? row.name : row.customerName;
        const meta = "mobile" in row ? row.mobile : row.propertyId || "بدون فایل مرتبط";
        const detail = "request" in row ? row.request : "amount" in row ? `${Number(row.amount).toLocaleString("fa-IR")} تومان` : row.title;
        return <article key={row.id}>
          <div><SelectionCheckbox id={row.id} label={title||row.id} selection={selection}/><span className="portal-avatar">{String(title || "ح").slice(0, 1)}</span><span><strong>{title || "بدون نام"}</strong><small>{meta || "—"}</small></span></div>
          <p>{detail}</p><em>{labels[row.status] || row.status}</em>
          <div className="portal-row-actions"><button aria-label={`ویرایش ${title}`} onClick={() => startEdit(row)}><Pencil1Icon />ویرایش</button><button className="danger" aria-label={`حذف ${title}`} disabled={busy} onClick={() => remove(row)}><TrashIcon />حذف</button></div>
        </article>;
      })}
      {loading && <div className="portal-empty">در حال دریافت اطلاعات…</div>}
      {!loading && !rows.length && <div className="portal-empty">هنوز رکوردی در این بخش ثبت نشده است.</div>}
    </div>
  </section>;
}

type ContractDocument = { id: string; key: string; name: string; type: string; size: number; url: string };
function ContractDocuments({ contractId }: { contractId: string }) {
  const [items, setItems] = useState<ContractDocument[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const load = () => fetch(`/api/contract-documents?contractId=${encodeURIComponent(contractId)}`, { headers: { "x-hatam-preview-role": "agency" }, cache: "no-store" }).then(response => response.ok ? response.json() : Promise.reject()).then(body => setItems(body.items || [])).catch(() => setError("دریافت مدارک انجام نشد."));
  useEffect(() => { void load(); }, [contractId]);
  const upload = async (files: FileList | null) => {
    if (!files?.length) return; setBusy(true); setError("");
    try { for (const file of Array.from(files)) { const data = new FormData(); data.set("contractId", contractId); data.set("file", file); const response = await fetch("/api/contract-documents", { method: "POST", headers: { "x-hatam-preview-role": "agency" }, body: data }); if (!response.ok) throw new Error(); } await load(); }
    catch { setError("آپلود مدرک انجام نشد؛ PDF یا تصویر تا ۲۵ مگابایت مجاز است."); } finally { setBusy(false); }
  };
  const remove = async (item: ContractDocument) => { setBusy(true); setError(""); try { const response = await fetch(`/api/contract-documents?key=${encodeURIComponent(item.key)}`, { method: "DELETE", headers: { "x-hatam-preview-role": "agency" } }); if (!response.ok) throw new Error(); await load(); } catch { setError("حذف مدرک انجام نشد."); } finally { setBusy(false); } };
  return <section className="agency-field-wide contract-documents"><header><div><strong>مدارک قرارداد</strong><small>PDF یا تصویر؛ حداکثر ۲۵ مگابایت</small></div><label className="contract-upload"><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={event => { void upload(event.target.files); event.target.value = ""; }} />{busy ? "در حال پردازش…" : "افزودن مدرک"}</label></header>{items.map(item => <article key={item.id}><a href={item.url} target="_blank" rel="noreferrer">{item.name}</a><span>{Math.max(1, Math.round(item.size / 1024)).toLocaleString("fa-IR")} کیلوبایت</span><button disabled={busy} onClick={() => remove(item)}>حذف</button></article>)}{!items.length && <p>هنوز مدرکی به این قرارداد پیوست نشده است.</p>}{error && <p className="portal-form-error">{error}</p>}</section>;
}
import ArchiveFilters,{useArchiveFilter} from "../components/ArchiveFilters";
