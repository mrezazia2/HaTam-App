"use client";
import BulkSelection,{SelectionCheckbox,useBulkSelection,bulkFetch} from "../components/BulkSelection";

import Link from "next/link";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useEffect, useMemo, useState } from "react";
import PropertyManagerModal from "./PropertyManagerModal";

type Member = { accountId: string; name: string | null; mobile: string | null; title: string; status: string };
type Property = {
  id: string; title: string; address: string; area: number; bedrooms: number; price: number;
  status: string; coverImage: string | null; consultantAccountId: string | null;
};
type Workspace = { members: Member[]; properties: Property[] };

const statusLabels: Record<string, string> = { draft: "پیش‌نویس", pending: "در انتظار بررسی", published: "منتشرشده", rejected: "ردشده", archived: "بایگانی" };

export default function AgencyPropertiesView() {
  const selection=useBulkSelection();
  const [data, setData] = useState<Workspace>({ members: [], properties: [] });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [manageId, setManageId] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/agency/workspace", { headers: { "x-hatam-preview-role": "agency" }, cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setData({ members: body.members || [], properties: body.properties || [] });
    } catch {
      setError("دریافت فایل‌های آژانس انجام نشد.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  const members = data.members.filter(item => item.status === "active");
  const memberMap = new Map(data.members.map(item => [item.accountId, item]));
  const rows = useMemo(() => data.properties.filter(item => {
    const matchesQuery = `${item.title} ${item.address} ${item.id}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (status === "all" || item.status === status);
  }), [data.properties, query, status]);

  const assign = async (propertyId: string, consultantAccountId: string) => {
    setBusyId(propertyId);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/agency/workspace", {
        method: "POST",
        headers: { "content-type": "application/json", "x-hatam-preview-role": "agency" },
        body: JSON.stringify({ resource: "assign-property", payload: { propertyId, consultantAccountId: consultantAccountId || null } }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setData(current => ({ ...current, properties: current.properties.map(item => item.id === propertyId ? { ...item, consultantAccountId: consultantAccountId || null } : item) }));
      setMessage(consultantAccountId ? "مشاور مسئول فایل با موفقیت تغییر کرد." : "تخصیص مشاور از فایل برداشته شد.");
    } catch {
      setError("تخصیص فایل ذخیره نشد؛ فقط مشاور فعال همان آژانس قابل انتخاب است.");
    } finally {
      setBusyId("");
    }
  };

  return <section className="portal-module agency-properties">
    <div className="portal-toolbar agency-property-toolbar">
      <label><MagnifyingGlassIcon /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="جست‌وجو با عنوان، آدرس یا شناسه فایل…" /></label>
      <div>
        <select aria-label="فیلتر وضعیت فایل" value={status} onChange={event => setStatus(event.target.value)}>
          <option value="all">همه وضعیت‌ها</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
    </div>
    <div className="agency-property-summary">
      <span>{rows.length.toLocaleString("fa-IR")} فایل نمایش داده می‌شود</span>
      <span>{members.length.toLocaleString("fa-IR")} مشاور فعال قابل تخصیص</span>
    </div>
    <BulkSelection ids={rows.map(x=>x.id)} selection={selection} actions={[{value:"pending",label:"ارسال برای تأیید"},{value:"archived",label:"بایگانی"}]} run={async(id,status)=>{await bulkFetch(`/api/properties/${encodeURIComponent(id)}`,"PATCH",{status},"agency")}} onDone={load}/>
    {error && <p className="portal-form-error" role="alert">{error}</p>}
    {message && <p className="portal-form-success" role="status">{message}</p>}
    <div className="portal-module-card">
      <div className="portal-module-head"><span>ملک</span><span>مشخصات و مسئول</span><span>وضعیت</span><span>عملیات</span></div>
      {rows.map(item => {
        const assigned = item.consultantAccountId ? memberMap.get(item.consultantAccountId) : null;
        return <article key={item.id}>
          <div><SelectionCheckbox id={item.id} label={item.title} selection={selection}/>{item.coverImage ? <img src={item.coverImage} alt="" /> : <span className="portal-avatar">{item.title.slice(0, 1)}</span>}<span><strong>{item.title}</strong><small>{item.address || item.id}</small></span></div>
          <div className="agency-property-details">
            <p>{item.area.toLocaleString("fa-IR")} متر · {item.bedrooms.toLocaleString("fa-IR")} خواب · {item.price.toLocaleString("fa-IR")} تومان</p>
            <select aria-label={`مشاور مسئول ${item.title}`} disabled={busyId === item.id} value={item.consultantAccountId || ""} onChange={event => void assign(item.id, event.target.value)}>
              <option value="">بدون مشاور مسئول</option>
              {item.consultantAccountId && !assigned && <option value={item.consultantAccountId} disabled>مشاور غیرفعال یا خارج از تیم</option>}
              {members.map(member => <option key={member.accountId} value={member.accountId}>{member.name || member.mobile} · {member.title}</option>)}
            </select>
            {item.consultantAccountId && !assigned && <small className="agency-assignment-warning">مشاور فعلی عضو فعال آژانس نیست؛ برای تغییر، یک مشاور فعال انتخاب کنید.</small>}
          </div>
          <em>{statusLabels[item.status] || item.status}</em>
          <div className="portal-row-actions"><button onClick={() => setManageId(item.id)}>مدیریت</button>{item.status === "published" && <Link href={`/property/${item.id}`}>نمایش</Link>}</div>
        </article>;
      })}
      {loading && <div className="portal-empty">در حال دریافت فایل‌های واقعی…</div>}
      {!loading && !rows.length && <div className="portal-empty">{data.properties.length ? "فایلی مطابق جست‌وجو و وضعیت انتخابی پیدا نشد." : "هنوز ملکی برای این آژانس ثبت نشده است."}</div>}
    </div>
    {manageId && <PropertyManagerModal role="agency" propertyId={manageId} onClose={() => setManageId("")} onSaved={() => { setMessage("تغییرات ملک ذخیره و برای بررسی ارسال شد."); void load(); }} />}
  </section>;
}
