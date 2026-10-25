"use client";
import BulkSelection,{SelectionCheckbox,useBulkSelection,bulkFetch} from "../components/BulkSelection";

import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon, PersonIcon, ReloadIcon, TrashIcon } from "@radix-ui/react-icons";
import { deleteUrgentSale, fetchUrgentSalesData, updateUrgentSale, type UrgentSaleRequest, type UrgentSaleStatus } from "../mobile/urgent-sale-store";

type Consultant = { id: string; name: string; mobile: string };

export default function UrgentSaleManager({ notify,onChanged }: { notify: (message: string) => void;onChanged?:()=>void }) {
  const selection=useBulkSelection();
  const [items, setItems] = useState<UrgentSaleRequest[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    setError("");
    fetchUrgentSalesData().then(data => { setItems(data.items); setConsultants(data.consultants); })
      .catch(() => setError("دریافت درخواست‌ها از پایگاه داده انجام نشد؛ اطلاعات قدیمی نمایش داده نمی‌شود."))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const update = async (id: string, patch: Partial<UrgentSaleRequest> & { assignedConsultantId?: string }) => {
    const previous = items;
    setItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
    try { await updateUrgentSale(id, patch); notify("درخواست در پایگاه داده به‌روزرسانی شد."); onChanged?.(); }
    catch { setItems(previous); notify("ذخیره تغییرات انجام نشد."); }
  };
  const remove = async (id: string) => {
    if (!window.confirm("این درخواست حذف شود؟")) return;
    try { await deleteUrgentSale(id); setItems(current => current.filter(item => item.id !== id)); notify("درخواست حذف شد."); onChanged?.(); }
    catch { notify("حذف درخواست انجام نشد."); }
  };
  const rows = useMemo(() => items.filter(item => `${item.firstName} ${item.lastName} ${item.mobile || ""} ${item.address} ${item.id}`.includes(query.trim())), [items, query]);
  return <section className="urgent-admin">
    <div className="entity-toolbar"><label><MagnifyingGlassIcon /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="جست‌وجو با نام، موبایل، آدرس یا شناسه درخواست..." /></label><span>{rows.length.toLocaleString("fa-IR")} درخواست</span><button onClick={load} aria-label="به‌روزرسانی درخواست‌ها"><ReloadIcon /></button></div>
    <BulkSelection ids={rows.map(x=>x.id)} selection={selection} actions={[{value:"published",label:"تأیید و انتشار آگهی"},{value:"reviewing",label:"شروع بررسی"},{value:"rejected",label:"رد درخواست"},{value:"completed",label:"تکمیل پیگیری"}]} run={async(id,status)=>{if(status==="published")await bulkFetch("/api/admin/properties/moderate","POST",{id,source:"urgent",status});else await bulkFetch("/api/urgent-sales","PATCH",{id,status})}} onDone={()=>{load();onChanged?.()}}/>
    {error && <p className="urgent-admin-error" role="alert">{error}</p>}
    <div className="urgent-admin-list">{rows.map(item => <article key={item.id}>
      <header><div><SelectionCheckbox id={item.id} label={`${item.firstName} ${item.lastName}`} selection={selection}/><b><PersonIcon /></b><span><strong>{item.firstName} {item.lastName}</strong><small>{item.id} · {new Date(item.createdAt).toLocaleString("fa-IR")} · {item.mobile || "بدون موبایل"}</small></span></div><select value={item.status} onChange={event => update(item.id, { status: event.target.value as UrgentSaleStatus })}>{["جدید", "در بررسی", "ارجاع‌شده", "تکمیل‌شده", "ردشده"].map(status => <option key={status}>{status}</option>)}</select></header>
      <div className="urgent-admin-facts"><span><small>آدرس</small><b>{item.address}</b></span><span><small>ملک</small><b>{item.area.toLocaleString("fa-IR")} متر · {item.bedrooms.toLocaleString("fa-IR")} خواب · سال {item.buildingAge.toLocaleString("fa-IR", { useGrouping: false })}</b></span><span><small>قیمت مدنظر</small><b>{item.expectedPrice.toLocaleString("fa-IR")} تومان</b></span><span><small>امکانات</small><b>{item.amenities.join("، ") || "—"}</b></span></div>
      {Boolean(item.media?.length) && <div className="urgent-admin-media"><strong>عکس و ویدیوهای مالک</strong><div>{item.media?.map(media => <a key={media.key} href={media.url} target="_blank" rel="noreferrer" aria-label={`مشاهده ${media.name}`}>{media.type.startsWith("image/") ? <img src={media.url} alt={media.name} /> : <span>▶ ویدیو</span>}<small>{media.name}</small></a>)}</div></div>}
      <button type="button" onClick={async()=>{if(!confirm("درخواست به آگهی عمومی تبدیل و منتشر شود؟"))return;try{await bulkFetch("/api/admin/properties/moderate","POST",{id:item.id,source:"urgent",status:"published"});notify("آگهی منتشر شد؛ در مدیریت ملک‌ها قابل مشاهده است.");onChanged?.()}catch{notify("انتشار آگهی انجام نشد.")}}}>تأیید و انتشار آگهی</button><div className="urgent-assignment"><label><span>ارجاع به مشاور</span><select value={item.assignedConsultantId || ""} onChange={event => { const consultant = consultants.find(option => option.id === event.target.value); void update(item.id, { assignedConsultant: consultant?.name || "", assignedConsultantId: consultant?.id || "", status: consultant ? "ارجاع‌شده" : item.status }); }}><option value="">بدون ارجاع</option>{consultants.map(option => <option key={option.id} value={option.id}>{option.name} · {option.mobile}</option>)}</select></label><label><span>سطح دسترسی مشاور</span><select value={item.consultantAccess} onChange={event => update(item.id, { consultantAccess: event.target.value as UrgentSaleRequest["consultantAccess"] })}><option>مشاهده</option><option>ویرایش</option><option>مدیریت کامل</option></select></label><label className="urgent-note"><span>یادداشت ادمین</span><input value={item.adminNote} onChange={event => setItems(current => current.map(row => row.id === item.id ? { ...row, adminNote: event.target.value } : row))} onBlur={event => update(item.id, { adminNote: event.target.value })} placeholder="یادداشت داخلی یا دستور پیگیری..." /></label><button className="danger" onClick={() => remove(item.id)}><TrashIcon /> حذف</button></div>
    </article>)}{loading && <div className="entity-empty">در حال دریافت درخواست‌ها از پایگاه داده…</div>}{!loading && !error && !rows.length && <div className="entity-empty">هنوز درخواست فروش فوری ثبت نشده است.</div>}</div>
  </section>;
}
