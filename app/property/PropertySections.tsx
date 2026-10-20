"use client";
import {useState} from "react";
import AmenityIcon from './AmenityIcon';
import {asciiDigits} from "../auth/digits";
import {useMapEnabled} from "../navigation/useMapEnabled";
import {propertyBuildingYear} from '../mobile/property-filters';
import "./single-property.css";
import InteractiveMap,{validCoordinates} from '../components/InteractiveMap';

export function PropertySections({area,bedrooms,description,price,transactionType,appLayout=false}:{area:number;bedrooms:number;description:string;price:number;transactionType:string;appLayout?:boolean}){
 let data:Record<string,unknown>={};try{const parsed=JSON.parse(description);if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))data=parsed;}catch{data.description=description;}
 const number=(v:unknown)=>v===undefined||v===null||v===""||!Number.isFinite(Number(v))?"ثبت نشده":Number(v).toLocaleString('fa-IR',{useGrouping:false});
 const amenities=Array.isArray(data.amenities)?data.amenities.map(String):[];
 const priceBlock=(transactionType==='rent'?<RentalEstimate/>:<div className="single-price"><span>{transactionType==='presale'?'قیمت پیش‌فروش':'قیمت کل (تومان)'}</span><strong>{price.toLocaleString('fa-IR')} تومان</strong><small>قیمت هر متر: {Math.round(price/Math.max(area,1)).toLocaleString('fa-IR')} تومان</small></div>);
 return <div className={appLayout?"single-sections app-single-sections":"single-sections"}>
  <div className="single-facts">{[[number(area),'متراژ'],[number(bedrooms),'تعداد خواب'],[number(propertyBuildingYear(data)),'سال ساخت'],...(appLayout?[[number(data.floor),'طبقه'],[number(data.units),'واحد در طبقه']]:[])].map(([value,label])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
  {!appLayout&&priceBlock}
  {!appLayout&&<dl className="single-rows"><div><dt>طبقه</dt><dd>{number(data.floor)}{data.floors?` از ${number(data.floors)}`:''}</dd></div>{data.units!=null&&<div><dt>واحد در طبقه</dt><dd>{number(data.units)}</dd></div>}</dl>}
  <section><h2>ویژگی‌ها و امکانات</h2><div className="single-amenities">{['آسانسور','پارکینگ','پارکینگ موتور','حیاط','انباری','بالکن'].map(label=><div key={label} className={amenities.includes(label)?'available':'unavailable'}><AmenityIcon name={label}/><span>{label}<small>{amenities.includes(label)?'دارد':'ندارد / ثبت نشده'}</small></span></div>)}</div><details><summary>سایر ویژگی‌ها و امکانات</summary><div className="single-extra">{amenities.length?amenities.map(item=><span key={item}>{item}</span>):<p>امکانات تکمیلی ثبت نشده است.</p>}{['facade','passage','deeds','occupancy'].map(key=>data[key]?<p key={key}>{({facade:'نمای ساختمان',passage:'عرض گذر',deeds:'نوع سند',occupancy:'وضعیت سکونت'} as Record<string,string>)[key]}: {Array.isArray(data[key])?(data[key] as unknown[]).join('، '):String(data[key])}</p>:null)}</div></details></section>
  <details><summary>بررسی و کارشناسی</summary><p>برای بررسی مدارک و هماهنگی بازدید، درخواست مشاوره ثبت کنید. تأیید انتشار آگهی به معنی تأیید حقوقی اسناد نیست.</p></details>
  <section><h2>توضیحات تکمیلی</h2><p className="single-description">{String(data.description||'توضیحات تکمیلی برای این ملک ثبت نشده است.')}</p></section>
  {appLayout&&priceBlock}
 </div>;
}
function RentalEstimate(){
 const [deposit,setDeposit]=useState(''),[monthly,setMonthly]=useState(''),[conversion,setConversion]=useState(0);
 const parse=(s:string)=>Number(asciiDigits(s).replace(/\D/g,''))||0;
 const input=(s:string)=>{const value=asciiDigits(s).replace(/\D/g,'').slice(0,15);return value?Number(value).toLocaleString('fa-IR'):'';};
 const extra=Math.round(parse(monthly)*(conversion/100)/30000)*1000000;
 return <section className="single-rental"><p>محاسبهٔ تقریبی تبدیل اجاره به رهن</p><small>مبالغ پیشنهادی خود را وارد کنید؛ این محاسبه قیمت یا موافقت مالک نیست. نرخ نمونه: هر یک میلیون تومان رهن، ۳۰ هزار تومان اجاره.</small><div className="single-rent-inputs"><label>ودیعه (تومان)<input inputMode="numeric" value={deposit} onChange={e=>setDeposit(input(e.target.value))} placeholder="مبلغ ودیعه"/></label><label>اجاره ماهانه (تومان)<input inputMode="numeric" value={monthly} onChange={e=>setMonthly(input(e.target.value))} placeholder="اجاره ماهانه"/></label></div><label className="single-range">میزان تبدیل اجاره به رهن<input type="range" min="0" max="100" value={conversion} onChange={e=>setConversion(Number(e.target.value))}/></label><div className="single-rent-values"><div><span>ودیعهٔ برآوردی</span><strong>{(parse(deposit)+extra).toLocaleString('fa-IR')} تومان</strong></div><div><span>اجارهٔ برآوردی</span><strong>{Math.round(parse(monthly)*(1-conversion/100)).toLocaleString('fa-IR')} تومان</strong></div></div></section>;
}
export function PropertyMap({latitude,longitude}:{latitude:number|null;longitude:number|null}){
 const enabled=useMapEnabled();if(!enabled||!validCoordinates(latitude,longitude))return null;
 const lat=Number(latitude),lng=Number(longitude);if(!Number.isFinite(lat)||!Number.isFinite(lng))return null;
 const bbox=[lng-.008,lat-.006,lng+.008,lat+.006].join(',');
 return <section className="single-map"><h2>موقعیت ملک</h2><InteractiveMap center={[lat,lng]} points={[{id:'property',latitude:lat,longitude:lng,label:'موقعیت ملک'}]} height={280}/><a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`} target="_blank" rel="noopener noreferrer">بازکردن نقشه</a></section>;
}
