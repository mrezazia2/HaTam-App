"use client";
import { useState } from "react";
import Link from "next/link";
import WorkflowView from "../../portals/WorkflowView";

export default function ScheduleConsole() {
  const [tab, setTab] = useState<"visits" | "consultations">("visits");
  return <main className="admin-schedule-page" dir="rtl">
    <header><div><span>مرکز برنامه‌ریزی حاتم</span><h1>بازدیدها و مشاوره‌ها</h1><p>زمان‌بندی، تخصیص مشاور، تغییر وضعیت و اطلاع‌رسانی طرفین معامله</p></div><Link href="/admin">بازگشت به مدیریت</Link></header>
    <nav><button className={tab === "visits" ? "active" : ""} onClick={() => setTab("visits")}>مدیریت بازدیدها</button><button className={tab === "consultations" ? "active" : ""} onClick={() => setTab("consultations")}>مدیریت مشاوره‌ها</button></nav>
    <WorkflowView key={tab} type={tab} kind="admin" />
  </main>;
}
