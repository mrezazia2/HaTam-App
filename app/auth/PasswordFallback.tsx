"use client";

import {useEffect,useState} from "react";
import {Cross2Icon,LockClosedIcon,MobileIcon} from "@radix-ui/react-icons";
import "./password-fallback.css";
import {mobileInput} from "./digits";

type Role="user"|"consultant"|"agency"|"admin";

export default function PasswordFallback(){
  const [visible,setVisible]=useState(false),[open,setOpen]=useState(false),[role,setRole]=useState<Role>("user"),[adminRoute,setAdminRoute]=useState(false),[username,setUsername]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  useEffect(()=>{const check=()=>{const path=location.pathname,isAdmin=path.startsWith("/login/admin");setAdminRoute(isAdmin);setVisible(path.startsWith("/login")||!!document.querySelector(".app-login-page"));if(isAdmin){setRole("admin");setOpen(true);return}if(path.startsWith("/login/consultant"))setRole("consultant");else if(path.startsWith("/login/agency"))setRole("agency");else setRole("user")};check();const observer=new MutationObserver(check);observer.observe(document.body,{subtree:true,childList:true});return()=>observer.disconnect()},[]);
  if(!visible)return null;
  const login=async()=>{setBusy(true);setError("");try{const response=await fetch("/api/auth/password-login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username,password,role})}),data=await response.json();if(!response.ok)throw new Error(data.error);location.href=data.destination}catch(reason){const code=reason instanceof Error?reason.message:"";setError(code==="ACCOUNT_NOT_ACTIVE"?"این حساب هنوز فعال نشده است.":code==="TOO_MANY_ATTEMPTS"?"تعداد تلاش‌ها زیاد بوده است؛ لطفاً ۱۵ دقیقه دیگر دوباره امتحان کنید.":"شماره موبایل یا رمز عبور صحیح نیست.")}finally{setBusy(false)}};
  const choices=adminRoute?(["admin"] as Role[]):(["user","consultant","agency"] as Role[]),labels=adminRoute?["مدیر"]:["کاربر","مشاور","آژانس"];
  return <div className={`password-fallback ${open?"open":""}`} dir="rtl">{!open?<button onClick={()=>setOpen(true)}><LockClosedIcon/>ورود با نام کاربری و رمز</button>:<section role="dialog" aria-label="ورود با رمز"><header><div><MobileIcon/><span><strong>{adminRoute?"ورود مدیر":"ورود جایگزین"}</strong><small>نام کاربری همان شماره موبایل شماست</small></span></div>{!adminRoute&&<button onClick={()=>setOpen(false)} aria-label="بستن"><Cross2Icon/></button>}</header><div className="password-role">{choices.map((item,index)=><button className={role===item?"active":""} key={item} onClick={()=>setRole(item)}>{labels[index]}</button>)}</div><label><span>نام کاربری / شماره موبایل</span><input autoFocus dir="ltr" inputMode="tel" value={username} onChange={event=>setUsername(mobileInput(event.target.value))} placeholder="09120000000"/></label><label><span>رمز عبور</span><input dir="ltr" type="password" value={password} onChange={event=>setPassword(event.target.value)} placeholder="حداقل ۸ کاراکتر" onKeyDown={event=>{if(event.key==="Enter"&&username.length===11&&password.length>=8&&!busy)void login()}}/></label>{error&&<p role="alert">{error}</p>}<button className="password-submit" disabled={busy||username.length!==11||password.length<8} onClick={login}>{busy?"در حال ورود...":"ورود به حساب"}</button><small>{adminRoute?"ورود مدیر در دفتر لاگ امنیتی ثبت می‌شود.":"در صورت فراموشی رمز، همچنان می‌توانید با کد یک‌بارمصرف وارد شوید."}</small></section>}</div>;
}
