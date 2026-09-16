"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import RequestManager from "../create/RequestManager";
import "../create/page.css";
type Option={id:string;name?:string};
export default function RequestsPage(){const [customers,setCustomers]=useState<Option[]>([]),[consultants,setConsultants]=useState<Option[]>([]);useEffect(()=>{fetch("/api/admin/create-center").then(r=>r.json()).then(d=>{setCustomers(d.customers||[]);setConsultants(d.consultants||[])})},[]);return <main className="create-center" dir="rtl"><header><div><span>مرکز عملیات مشتری</span><h1>درخواست‌های خرید و فروش</h1><p>ارجاع، پیگیری، تکمیل و اطلاع‌رسانی آنی درخواست‌های مشتریان.</p></div><div className="request-header-links"><Link href="/admin/create">ثبت درخواست جدید</Link><Link href="/admin">بازگشت به پنل</Link></div></header><RequestManager customers={customers} consultants={consultants}/></main>}
