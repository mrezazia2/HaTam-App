"use client";
import BulkSelection,{SelectionCheckbox,useBulkSelection,bulkFetch} from "../components/BulkSelection";
import { useEffect, useState } from "react";

type Kind = "user" | "consultant" | "agency" | "admin";
type Consultant = { id: string; name: string };
type Item = { id: string; propertyId?: string | null; propertyTitle?: string | null; subject?: string; scheduledAt?: string | number | null; status: string; notes?: string; customerName?: string; customerMobile?: string; consultantAccountId?: string | null; consultantName?: string | null };
const statusLabels: Record<string, string> = { requested: "درخواست‌شده", confirmed: "تأییدشده", scheduled: "زمان‌بندی‌شده", completed: "انجام‌شده", cancelled: "لغوشده" };
const toLocalInput = (value?: string | number | null) => {
  const date = value ? new Date(value) : new Date(Date.now() + 24 * 60 * 60_000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

export default function WorkflowView({ type, kind }: { type: "visits" | "consultations"; kind: Kind }) {
  const selection=useBulkSelection();
  const [items, setItems] = useState<Item[]>([]), [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true), [editing, setEditing] = useState<Item | null>(null);
  const [scheduledAt, setScheduledAt] = useState(""), [status, setStatus] = useState(""), [notes, setNotes] = useState(""), [consultantId, setConsultantId] = useState("");
  const [saving, setSaving] = useState(false), [error, setError] = useState("");
  const manager = kind !== "user";
  const load = () => {
    setLoading(true);
    fetch(`/api/${type}`, { headers: { "x-hatam-preview-role": kind }, cache: "no-store" })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(result => { setItems(result.items || []); setConsultants(result.consultants || []); })
      .catch(() => setError("دریافت برنامه‌ها انجام نشد."))
      .finally(() => setLoading(false));
  };
  useEffect(load, [type, kind]);
  const open = (item: Item) => {
    setEditing(item); setScheduledAt(toLocalInput(item.scheduledAt)); setStatus(item.status);
    setNotes(item.notes || ""); setConsultantId(item.consultantAccountId || ""); setError("");
  };
  const save = async () => {
    if (!editing) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/${type}`, { method: "PATCH", headers: { "content-type": "application/json", "x-hatam-preview-role": kind }, body: JSON.stringify({ id: editing.id, status, scheduledAt: new Date(scheduledAt).toISOString(), ...(type === "consultations" ? { notes } : {}), ...(["agency", "admin"].includes(kind) ? { consultantAccountId: consultantId || null } : {}) }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setEditing(null); load();
    } catch (reason) {
      setError(reason instanceof Error && reason.message === "CONSULTANT_NOT_AVAILABLE" ? "مشاور انتخاب‌شده فعال یا عضو این آژانس نیست." : "زمان، وضعیت و مشاور مسئول را بررسی کنید.");
    } finally { setSaving(false); }
  };
  const cancel = async (item: Item) => {
    const response = await fetch(`/api/${type}`, { method: "PATCH", headers: { "content-type": "application/json", "x-hatam-preview-role": kind }, body: JSON.stringify({ id: item.id, status: "cancelled" }) });
    if (response.ok) load(); else setError("لغو درخواست انجام نشد.");
  };
  return <section className="portal-module workflow-view">
    <div className="portal-toolbar"><strong>{type === "visits" ? "برنامه بازدیدها" : "برنامه مشاوره‌ها"}</strong><span>{items.length.toLocaleString("fa-IR")} مورد</span></div>
    <BulkSelection ids={items.map(x=>x.id)} selection={selection} actions={manager?[{value:type==="visits"?"confirmed":"scheduled",label:"تأیید برنامه"},{value:"completed",label:"انجام‌شده"},{value:"cancelled",label:"لغو"}]:[{value:"cancelled",label:"لغو درخواست"}]} run={async(id,status)=>{await bulkFetch(`/api/${type}`,"PATCH",{id,status},kind)}} onDone={load}/>
    {error && !editing && <p className="portal-form-error" role="alert">{error}</p>}
    <div className="portal-module-card"><div className="portal-module-head"><span>درخواست و مشتری</span><span>زمان و مسئول</span><span>وضعیت</span><span>عملیات</span></div>{items.map(item => <article key={item.id}>
      <div><SelectionCheckbox id={item.id} label={item.propertyTitle||item.subject||item.id} selection={selection}/><span className="portal-avatar">{type === "visits" ? "ب" : "م"}</span><span><strong>{item.propertyTitle || item.subject || "درخواست جدید"}</strong><small>{item.customerName || "کاربر"} · {item.id}</small></span></div>
      <p>{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString("fa-IR") : "در انتظار زمان‌بندی"}<small>{item.consultantName ? ` · ${item.consultantName}` : " · بدون مشاور"}</small></p>
      <em>{statusLabels[item.status] || item.status}</em>
      <div>{manager ? <button onClick={() => open(item)}>مدیریت</button> : !["cancelled", "completed"].includes(item.status) ? <button onClick={() => cancel(item)}>لغو درخواست</button> : <span>—</span>}</div>
    </article>)}{!loading && !items.length && <div className="portal-empty">هنوز درخواستی ثبت نشده است.</div>}{loading && <div className="portal-empty">در حال دریافت اطلاعات…</div>}</div>
    {editing && <div className="portal-modal workflow-modal" role="presentation" onMouseDown={() => setEditing(null)}><section role="dialog" aria-modal="true" aria-label="مدیریت برنامه" onMouseDown={event => event.stopPropagation()}>
      <header><div><span>{editing.id}</span><h2>{type === "visits" ? "مدیریت بازدید" : "مدیریت مشاوره"}</h2></div><button onClick={() => setEditing(null)} aria-label="بستن">×</button></header>
      <div className="workflow-form"><label><span>تاریخ و ساعت</span><input type="datetime-local" dir="ltr" value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} /></label>
        <label><span>وضعیت</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="requested">درخواست‌شده</option><option value={type === "visits" ? "confirmed" : "scheduled"}>{type === "visits" ? "تأییدشده" : "زمان‌بندی‌شده"}</option><option value="completed">انجام‌شده</option><option value="cancelled">لغوشده</option></select></label>
        {["agency", "admin"].includes(kind) && <label><span>مشاور مسئول</span><select value={consultantId} onChange={event => setConsultantId(event.target.value)}><option value="">بدون مشاور</option>{consultants.map(consultant => <option key={consultant.id} value={consultant.id}>{consultant.name}</option>)}</select></label>}
        {type === "consultations" && <label className="wide"><span>یادداشت مشاوره</span><textarea value={notes} onChange={event => setNotes(event.target.value)} /></label>}
      </div>
      <p className="workflow-reminder-note">با ذخیره برنامه، یادآوری درون‌برنامه‌ای و پیامکی مطابق قوانین تعیین‌شده در پنل ادمین بازسازی می‌شود.</p>
      {error && <p className="portal-form-error" role="alert">{error}</p>}
      <footer><button onClick={() => setEditing(null)}>انصراف</button><button className="portal-primary" disabled={saving || !scheduledAt} onClick={save}>{saving ? "در حال ذخیره…" : "ذخیره و اطلاع‌رسانی"}</button></footer>
    </section></div>}
  </section>;
}
