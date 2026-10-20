"use client";
import {useEffect,useState} from 'react';
import {DrawingPinIcon,MobileIcon,HomeIcon,IdCardIcon} from '@radix-ui/react-icons';
import {navigateApp} from '../mobile/app-navigation';
import {persianDigits} from '../auth/digits';
import './consultant-profile.css';
export type PublicConsultant={id:string;name:string;mobile:string;address:string;specialty:string;activeFiles:number;avatar:string;biography?:string};
export default function ConsultantProfile({id,inApp=true}:{id:string;inApp?:boolean}){
 const [result,setResult]=useState<{id:string;item?:PublicConsultant;error?:string}|null>(null);
 useEffect(()=>{const controller=new AbortController();fetch('/api/consultants?id='+encodeURIComponent(id),{signal:controller.signal,cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(r.status===404?'این مشاور فعال نیست یا پیدا نشد.':'دریافت اطلاعات مشاور انجام نشد.');setResult({id,item:d.item})}).catch(e=>{if(!controller.signal.aborted)setResult({id,error:e.message})});return()=>controller.abort()},[id]);
 if(result?.id!==id)return <p className="consultant-profile-state" role="status">در حال دریافت اطلاعات مشاور…</p>;
 if(!result.item)return <p className="consultant-profile-state" role="alert">{result.error}</p>;
 const consultant=result.item,phone=consultant.mobile.replace(/[^+\d]/g,'');
 return <main className="app-consultant-profile" dir="rtl"><header><div className="consultant-profile-photo"><img src={consultant.avatar} alt={consultant.name}/></div><span>تیم حرفه‌ای املاک حاتم</span><h1>{consultant.name}</h1><p>{consultant.specialty}</p></header><section className="consultant-profile-stats"><IdCardIcon/><strong>{consultant.activeFiles.toLocaleString('fa-IR')}</strong><span>ملک منتشرشده</span></section><section className="consultant-profile-section"><h2>راه‌های ارتباطی</h2><div><DrawingPinIcon/><p>{consultant.address}</p></div>{phone?<a className="consultant-profile-phone" href={'tel:'+phone}><MobileIcon/><span>شماره تماس</span><b dir="ltr">{persianDigits(consultant.mobile)}</b></a>:<p>شماره تماس ثبت نشده است.</p>}</section><section className="consultant-profile-section"><h2>مشاوره و همراهی در خرید و فروش</h2><p>{consultant.biography||'برای هماهنگی بازدید و بررسی فایل‌های منتشرشده، با این مشاور تماس بگیرید. مشخصات هر ملک را پیش از تصمیم‌گیری بررسی کنید.'}</p><button type="button" className="consultant-profile-properties" onClick={()=>navigateApp(inApp?`/app?screen=consultant-properties&consultantId=${encodeURIComponent(id)}`:`/consultants/${encodeURIComponent(id)}/properties`)}><HomeIcon/>مشاهده فایل‌های مشاور</button></section></main>
}
