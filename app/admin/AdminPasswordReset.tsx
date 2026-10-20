"use client";
import {useState} from "react";
import "./admin-password-reset.css";

export default function AdminPasswordReset({resource,id,mobile}:{resource:"customers"|"consultants"|"agencies";id:string;mobile:string}){
 const [password,setPassword]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const submit=async()=>{
  setMessage("");setBusy(true);
  try{const response=await fetch("/api/admin/account-password",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({resource,id,password})});const data=await response.json();if(!response.ok)throw new Error(data.error||"FAILED");setPassword("");setMessage("رمز جدید ثبت شد و نشست‌های قبلی این حساب باطل شدند. رمز را از مسیر امن به صاحب حساب اطلاع دهید.")}
  catch(error){setMessage(error instanceof Error&&error.message==="WEAK_PASSWORD"?"رمز باید ۸ تا ۱۲۸ نویسه و شامل حرف و عدد باشد؛ شماره موبایل یا رمز رایج نباشد.":"تغییر رمز انجام نشد؛ حساب یا دسترسی را بررسی کنید.")}finally{setBusy(false)}
 };
 return <section className="admin-password-reset"><h3>بازنشانی رمز ورود</h3><p>نام کاربری این حساب {mobile} است. رمز فعلی قابل مشاهده نیست؛ مدیر فقط می‌تواند رمز جدید تعیین کند.</p><label><span>رمز جدید</span><input type="password" autoComplete="new-password" minLength={8} value={password} onChange={event=>setPassword(event.target.value)}/></label><button type="button" disabled={busy||password.length<8} onClick={submit}>{busy?"در حال ثبت...":"ثبت رمز جدید"}</button>{message&&<p role="status">{message}</p>}</section>
}
