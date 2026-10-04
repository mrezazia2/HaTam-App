"use client";
import { useEffect, useRef, useState } from "react";
import { CalendarIcon, ChatBubbleIcon, Cross2Icon, HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";
import "./actions.css";

type Action = "visit" | "consultation";
const headers = { "content-type": "application/json", "x-hatam-preview-role": "user" };
const localDateTime = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function PropertyActions({ propertyId, notify }: { propertyId: string; notify: (text: string) => void }) {
  const [busy, setBusy] = useState<Action | "favorite" | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [scheduledAt, setScheduledAt] = useState(localDateTime(new Date(Date.now() + 86400000)));
  const [subject, setSubject] = useState("مشاوره درباره این ملک");
  const [notes, setNotes] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { fetch(`/api/favorites?propertyId=${encodeURIComponent(propertyId)}`, { headers }).then(r => r.ok ? r.json() : null).then(data => data && setFavorite(Boolean(data.favorite))).catch(() => {}); }, [propertyId]);
  useEffect(() => { if (!action) return; const close = (event: KeyboardEvent) => { if (event.key === "Escape") setAction(null); }; document.addEventListener("keydown", close); window.setTimeout(() => closeRef.current?.focus(), 0); return () => document.removeEventListener("keydown", close); }, [action]);

  const send = async () => {
    if (!action) return; setBusy(action);
    try {
      const endpoint = action === "visit" ? "/api/visits" : "/api/consultations";
      const body = action === "visit" ? { propertyId, scheduledAt: new Date(scheduledAt).toISOString() } : { propertyId, subject, notes, scheduledAt: new Date(scheduledAt).toISOString() };
      const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) { window.location.assign(`/login/user?returnTo=${encodeURIComponent(`/property/${propertyId}`)}`); return; }
      if (!response.ok) throw new Error(result.error || "REQUEST_FAILED");
      setAction(null); setNotes("");
      notify(action === "visit" ? "درخواست بازدید، گفت‌وگو و یادآوری ثبت شد." : "درخواست مشاوره، گفت‌وگو و یادآوری ثبت شد.");
    } catch (error) { const key = error instanceof Error ? error.message : ""; notify(key === "INVALID_SCHEDULE" ? "زمانی در آینده انتخاب کنید." : key === "PROPERTY_NOT_AVAILABLE" ? "این فایل دیگر برای ثبت درخواست در دسترس نیست." : "ثبت درخواست انجام نشد؛ دوباره تلاش کنید."); }
    finally { setBusy(null); }
  };

  const toggleFavorite = async () => {
    setBusy("favorite");
    try {
      const response = await fetch(favorite ? `/api/favorites?propertyId=${encodeURIComponent(propertyId)}` : "/api/favorites", { method: favorite ? "DELETE" : "POST", headers, body: favorite ? undefined : JSON.stringify({ propertyId }) });
      if (response.status === 401) { window.location.assign(`/login/user?returnTo=${encodeURIComponent(`/property/${propertyId}`)}`); return; }
      if (!response.ok) throw new Error(); setFavorite(!favorite); notify(favorite ? "از علاقه‌مندی‌ها حذف شد." : "به علاقه‌مندی‌ها اضافه شد.");
    } catch { notify("ذخیره علاقه‌مندی انجام نشد؛ دوباره تلاش کنید."); } finally { setBusy(null); }
  };

  return <>
    <button className="property-action" disabled={busy !== null} onClick={() => setAction("visit")}><CalendarIcon/>درخواست بازدید</button>
    <button disabled={busy !== null} onClick={() => setAction("consultation")}><ChatBubbleIcon/>درخواست مشاوره</button>
    <button disabled={busy !== null} onClick={toggleFavorite}>{favorite ? <HeartFilledIcon/> : <HeartIcon/>}{busy === "favorite" ? "در حال ذخیره…" : favorite ? "حذف از علاقه‌مندی" : "ذخیره ملک"}</button>
    {action && <div className="property-request-backdrop" onMouseDown={() => setAction(null)}><form className="property-request-dialog" role="dialog" aria-modal="true" aria-labelledby="property-request-title" onSubmit={event => { event.preventDefault(); void send(); }} onMouseDown={event => event.stopPropagation()}>
      <header><div><span>{action === "visit" ? "هماهنگی حضوری" : "گفت‌وگو با کارشناس"}</span><h2 id="property-request-title">{action === "visit" ? "انتخاب زمان بازدید" : "درخواست مشاوره"}</h2></div><button ref={closeRef} type="button" onClick={() => setAction(null)} aria-label="بستن"><Cross2Icon/></button></header>
      <label><span>زمان پیشنهادی</span><input type="datetime-local" required min={localDateTime(new Date(Date.now() + 30 * 60000))} value={scheduledAt} onChange={event => setScheduledAt(event.target.value)}/></label>
      {action === "consultation" && <><label><span>موضوع مشاوره</span><input required minLength={3} maxLength={160} value={subject} onChange={event => setSubject(event.target.value)}/></label><label><span>توضیحات تکمیلی</span><textarea maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} placeholder="بودجه، زمان‌بندی یا سؤال خود را بنویسید…"/></label></>}
      <p>پس از ثبت، درخواست در پنل شما و مشاور نمایش داده می‌شود و یادآوری‌های فعال سامانه ایجاد خواهند شد.</p>
      <footer><button type="button" onClick={() => setAction(null)}>انصراف</button><button className="submit" disabled={busy !== null} type="submit">{busy === action ? "در حال ثبت…" : "ثبت درخواست"}</button></footer>
    </form></div>}
  </>;
}
