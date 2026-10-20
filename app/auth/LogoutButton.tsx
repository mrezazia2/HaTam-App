"use client";
import {useState} from 'react';
import './logout-error.css';
export default function LogoutButton(){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const logout=async()=>{setBusy(true);setError('');try{
  const inApp=location.pathname.startsWith('/app')||['web.hatamestate.com','app.hatamestate.com'].includes(location.hostname)||window.matchMedia('(display-mode: standalone)').matches;
  let destination=inApp?'/app':'/login';
  try{const r=await fetch('/api/navigation',{cache:'no-store'});if(r.ok){const settings=await r.json();destination=(inApp?settings.appLogout:settings.siteLogout)||destination}}catch{}
  const response=await fetch('/api/auth/logout',{method:'POST'});if(!response.ok)throw Error();
  window.location.assign(destination);
 }catch{setError('خروج انجام نشد؛ اتصال را بررسی و دوباره تلاش کنید.');setBusy(false)}};
 return <><button className="session-logout" type="button" onClick={logout} disabled={busy}>{busy?'در حال خروج…':'خروج از حساب'}</button>{error&&<p className="logout-error" role="alert">{error}</p>}</>;
}
