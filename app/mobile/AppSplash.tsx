"use client";
import {useEffect,useRef,useState} from 'react';
export default function AppSplash(){
 const [visible,setVisible]=useState(false),[leaving,setLeaving]=useState(false);
 const started=useRef(false);
 useEffect(()=>{
  const key='hatam-app-launched';
  try{if(sessionStorage.getItem(key)&&!started.current)return;sessionStorage.setItem(key,'1')}catch{}
  started.current=true;
  setVisible(true);
  const start=window.setTimeout(()=>setLeaving(true),2000),remove=window.setTimeout(()=>setVisible(false),2450);
  return()=>{window.clearTimeout(start);window.clearTimeout(remove)};
 },[]);
 if(!visible)return null;
 return <div className={`hatam-app-splash ${leaving?'is-leaving':''}`} role="status" aria-label="در حال آماده‌سازی سوپر اپلیکیشن ملکی حاتم"><img src="/assets/hatam/app-splash-clean.png" alt="نشان حاتم و نمای شب تهران"/><div className="hatam-app-splash-copy"><strong>سوپر اپلیکیشن ملکی حاتم</strong><span>مسیر روشن، کار جمع</span></div><div className="hatam-app-splash-progress" aria-hidden="true"><i/></div></div>;
}
