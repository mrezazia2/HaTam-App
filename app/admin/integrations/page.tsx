"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon,GearIcon } from "@radix-ui/react-icons";
import IntegrationSettings from "../IntegrationSettingsConnected";
import SmsToolsPanel from "../SmsToolsPanel";
import CustomCodeSettings from "../CustomCodeSettings";
import { useBrand } from "../../brand/BrandProvider";
import "../ai-integrations.css";
export default function IntegrationsPage(){const {settings}=useBrand(),[notice,setNotice]=useState("");const notify=(text:string)=>{setNotice(text);window.setTimeout(()=>setNotice(""),2600)};return <main className="integration-page" dir="rtl"><header><Link href="/admin"><ChevronLeftIcon/>بازگشت به پنل ادمین</Link><div><img src={settings.logoUrl} alt={settings.brandName}/><span><small>تنظیمات زیرساخت</small><strong>پیامک و روش‌های پرداخت</strong></span></div><Link href="/admin/brand"><GearIcon/>هویت برند</Link></header><section><div className="integration-title"><span>پیکربندی بدون تغییر کد</span><h1>سرویس‌های ارتباطی و مالی</h1><p>ارائه‌دهنده، شناسه‌ها، شماره‌ها و الگوهای عملیاتی را از این بخش مدیریت کنید.</p></div><IntegrationSettings notify={notify}/><SmsToolsPanel notify={notify}/><CustomCodeSettings/></section>{notice&&<div className="admin-notice">{notice}</div>}</main>}
