"use client";
import {useState} from "react";
import {Cross2Icon,LockClosedIcon,MobileIcon} from "@radix-ui/react-icons";
import "./app-password-login.css";
import {mobileInput} from "./digits";
import {passkeyMessage,signInWithPasskey} from "./passkeys-client";

type Role="user"|"consultant"|"agency";
export default function AppPasswordLogin(){
 const [open,setOpen]=useState(false),[mode,setMode]=useState<"password"|"passkey">("password"),[role,setRole]=useState<Role>("user"),[username,setUsername]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const show=(next:"password"|"passkey")=>{setMode(next);setError("");setOpen(true)};
 const login=async()=>{setBusy(true);setError("");try{
  if(mode==="passkey"){const data=await signInWithPasskey(username,role,"app");window.location.href=data.destination;return}
  const response=await fetch("/api/auth/password-login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username,password,role,surface:"app"})}),data=await response.json();
  if(!response.ok)throw new Error(data.error);window.location.href=data.destination;
 }catch(reason){setError(mode==="passkey"?passkeyMessage(reason):reason instanceof Error&&reason.message==="ACCOUNT_NOT_ACTIVE"?"حساب شما هنوز توسط مدیر فعال نشده است.":"نام کاربری یا رمز عبور صحیح نیست.")}finally{setBusy(false)}};
 return <div className="app-password-login" dir="rtl">{!open?<div className="app-login-alternatives"><button className="app-password-trigger" onClick={()=>show("passkey")}><MobileIcon/><span><strong>ورود با قفل گوشی</strong><small>اثر انگشت، چهره یا رمز دستگاه</small></span></button><button className="app-password-trigger" onClick={()=>show("password")}><LockClosedIcon/><span><strong>ورود با نام کاربری و رمز عبور</strong><small>نام کاربری همان شماره موبایل شماست</small></span></button></div>:<section className="app-password-card"><header><div>{mode==="passkey"?<MobileIcon/>:<LockClosedIcon/>}<span><strong>{mode==="passkey"?"ورود با قفل دستگاه":"ورود با رمز عبور"}</strong><small>{mode==="passkey"?"بدون پیامک و بدون ارسال دادهٔ بیومتریک":"بدون نیاز به دریافت پیامک"}</small></span></div><button onClick={()=>setOpen(false)} aria-label="بستن"><Cross2Icon/></button></header><div className="app-password-roles">{(["user","consultant","agency"] as Role[]).map((value,index)=><button key={value} className={role===value?"active":""} onClick={()=>setRole(value)}>{["کاربر","مشاور","آژانس"][index]}</button>)}</div><label><span>نام کاربری / شماره موبایل</span><input dir="ltr" inputMode="tel" autoComplete="username" value={username} onChange={e=>setUsername(mobileInput(e.target.value))} placeholder="09120000000"/></label>{mode==="password"&&<label><span>رمز عبور</span><input dir="ltr" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="رمز عبور شما"/></label>}{error&&<p role="alert">{error}</p>}<button className="app-password-submit" disabled={busy||username.length!==11||(mode==="password"&&password.length<8)} onClick={login}>{busy?"در حال ورود...":mode==="passkey"?"تأیید با قفل دستگاه":"ورود به حساب"}</button><small>{mode==="passkey"?"اگر هنوز این قابلیت را فعال نکرده‌اید، یک‌بار با پیامک وارد شوید و در تنظیمات حساب فعالش کنید.":"اگر رمزتان را به یاد ندارید، از فرم کد یک‌بارمصرف بالای صفحه استفاده کنید."}</small><button className="app-password-switch" onClick={()=>setMode(mode==="passkey"?"password":"passkey")}>{mode==="passkey"?"ورود با رمز عبور":"ورود با قفل دستگاه"}</button></section>}</div>
}
