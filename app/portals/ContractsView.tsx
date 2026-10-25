"use client";
import BulkSelection,{SelectionCheckbox,useBulkSelection,bulkFetch} from "../components/BulkSelection";
import { useEffect, useState } from "react";

type Kind = "user" | "consultant" | "agency";
type Contract = { id: string; customerName: string; amount: number; status: string; propertyTitle?: string | null; signingAt?: string | number | null; notes?: string };
type Document = { id: string; name: string; url: string; size: number };
const labels: Record<string, string> = { draft: "پیش‌نویس", review: "در بررسی", signing: "در حال امضا", completed: "تکمیل‌شده", cancelled: "لغوشده" };

export default function ContractsView({ kind }: { kind: Kind }) {
  const selection=useBulkSelection();
  const [items, setItems] = useState<Contract[]>([]);
  const [documents, setDocuments] = useState<Record<string, Document[]>>({});
  const [open, setOpen] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/contracts", { headers: { "x-hatam-preview-role": kind }, cache: "no-store" })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(body => setItems(body.items || []))
      .catch(() => setError("دریافت قراردادها انجام نشد."))
      .finally(() => setLoading(false));
  }, [kind]);

  const loadDocuments = async (id: string) => {
    const response = await fetch(`/api/contract-documents?contractId=${encodeURIComponent(id)}`, { headers: { "x-hatam-preview-role": kind }, cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error();
    setDocuments(current => ({ ...current, [id]: body.items || [] }));
  };

  const toggle = async (id: string) => {
    if (open === id) return setOpen("");
    setOpen(id);
    if (documents[id]) return;
    try { await loadDocuments(id); } catch { setError("دریافت مدارک قرارداد انجام نشد."); }
  };

  const upload = async (contractId: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(contractId);
    setError("");
    try {
      const data = new FormData();
      data.set("contractId", contractId);
      data.set("file", file);
      const response = await fetch("/api/contract-documents", { method: "POST", headers: { "x-hatam-preview-role": kind }, body: data });
      if (!response.ok) throw new Error();
      await loadDocuments(contractId);
    } catch {
      setError("بارگذاری مدرک انجام نشد؛ فرمت PDF یا تصویر و حداکثر حجم ۲۵ مگابایت مجاز است.");
    } finally { setBusy(""); }
  };

  return <section className="portal-module contract-list-view">
    <div className="portal-toolbar"><strong>قراردادهای من</strong><span>{items.length.toLocaleString("fa-IR")} قرارداد</span></div>
    <BulkSelection ids={items.map(x=>x.id)} selection={selection} actions={[]} run={async()=>{}} exportRows={items}/>
    {error && <p className="portal-form-error">{error}</p>}
    <div className="portal-module-card">
      <div className="portal-module-head"><span>قرارداد</span><span>زمان امضا</span><span>وضعیت</span><span>عملیات</span></div>
      {items.map(item => <article className={open === item.id ? "contract-row-open" : ""} key={item.id}>
        <div><SelectionCheckbox id={item.id} label={item.propertyTitle||item.customerName} selection={selection}/><span className="portal-avatar">ق</span><span><strong>{item.propertyTitle || item.customerName}</strong><small>{item.id} · {Number(item.amount).toLocaleString("fa-IR")} تومان</small></span></div>
        <p>{item.signingAt ? new Date(item.signingAt).toLocaleString("fa-IR") : "هنوز تعیین نشده"}</p>
        <em>{labels[item.status] || item.status}</em>
        <button onClick={() => void toggle(item.id)}>{open === item.id ? "بستن" : "جزئیات و مدارک"}</button>
        {open === item.id && <div className="contract-row-details">
          <p>{item.notes || "یادداشتی ثبت نشده است."}</p>
          <label className="contract-party-upload">{busy === item.id ? "در حال بارگذاری…" : "افزودن مدرک"}<input disabled={busy === item.id} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={event => void upload(item.id, event.target.files)}/></label>
          {(documents[item.id] || []).map(document => <a key={document.id} href={document.url} target="_blank" rel="noreferrer"><span>{document.name}</span><small>{Math.ceil(document.size / 1024).toLocaleString("fa-IR")} KB</small></a>)}
          {documents[item.id] && !documents[item.id].length && <span>مدرکی پیوست نشده است.</span>}
        </div>}
      </article>)}
      {loading && <div className="portal-empty">در حال دریافت قراردادها…</div>}
      {!loading && !items.length && <div className="portal-empty">قراردادی برای این حساب ثبت نشده است.</div>}
    </div>
  </section>;
}
