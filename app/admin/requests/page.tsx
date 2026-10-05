"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import RequestManager from "../create/RequestManager";
import UrgentSaleManager from "../UrgentSaleManager";
import "../create/page.css";
type Option={id:string;name?:string};
export default function RequestsPage(){const [customers,setCustomers]=useState<Option[]>([]),[consultants,setConsultants]=useState<Option[]>([]),[notice,setNotice]=useState("");useEffect(()=>{fetch("/api/admin/create-center").then(r=>r.json()).then(d=>{setCustomers(d.customers||[]);setConsultants(d.consultants||[])})},[]);return <main className="create-center" dir="rtl"><header><div><span>مرکز عملیات مشتری</span><h1>درخواست‌های خرید و فروش</h1><p>ارجاع، پیگیری، تکمیل و اطلاع‌رسانی آنی درخواست‌های مشتریان.</p></div><div className="request-header-links"><Link href="/admin/create">ثبت درخواست جدید</Link><Link href="/admin">بازگشت به پنل</Link></div></header><RequestManager customers={customers} consultants={consultants}/><section className="request-manager"><header><div><span>درخواست‌های مالک</span><h2>فروش فوری ملک</h2></div></header><UrgentSaleManager notify={setNotice}/></section>{notice&&<p className="admin-notice" role="status">{notice}</p>}</main>}
