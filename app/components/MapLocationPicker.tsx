"use client";
import {useState} from 'react';
import {useMapEnabled} from '../navigation/useMapEnabled';
import InteractiveMap,{validCoordinates} from './InteractiveMap';
type Props={latitude:number|null;longitude:number|null;onChange:(latitude:number,longitude:number)=>void;compact?:boolean;locationMode?:"point"|"area";radius?:number;onModeChange?:(mode:"point"|"area")=>void;onRadiusChange?:(radius:number)=>void};
export default function MapLocationPicker({latitude,longitude,onChange,compact=false,locationMode="point",radius=300,onModeChange,onRadiusChange}:Props){
 const enabled=useMapEnabled(),[error,setError]=useState('');
 if(!enabled)return null;
 const valid=validCoordinates(latitude,longitude);
 const pick=(lat:number,lng:number)=>{if(!validCoordinates(lat,lng))return setError('لطفاً موقعیت داخل ایران را انتخاب کنید.');setError('');onChange(Number(lat.toFixed(6)),Number(lng.toFixed(6)))};
 return <section className={`map-picker ${compact?'compact':''}`}><div className="map-picker-head"><div><strong>موقعیت ملک روی نقشه</strong><span>با زوم، محله و معبر را پیدا کنید و روی نقطهٔ ملک بزنید.</span></div></div>{onModeChange&&<div className="map-picker-toolbar"><button type="button" className={locationMode==='point'?'active':''} onClick={()=>onModeChange?.('point')}>نقطه‌ای</button><button type="button" className={locationMode==='area'?'active':''} onClick={()=>onModeChange?.('area')}>محدوده‌ای</button></div>}<InteractiveMap points={valid?[{id:'selected',latitude,longitude,label:'موقعیت انتخاب‌شده'}]:[]} onPick={pick} radius={locationMode==='area'?radius:0} height={compact?300:430}/>{valid&&<p>مختصات: {latitude!.toLocaleString('fa-IR',{maximumFractionDigits:6})}، {longitude!.toLocaleString('fa-IR',{maximumFractionDigits:6})}</p>}{locationMode==='area'&&<label>شعاع نمایش: {radius.toLocaleString('fa-IR')} متر<input type="range" min="100" max="1000" step="50" value={radius} onChange={e=>onRadiusChange?.(Number(e.target.value))}/></label>}{error&&<p role="alert">{error}</p>}<small>انتخاب نقطهٔ واقعی الزامی است؛ موقعیت پیش‌فرض به‌جای ملک ذخیره نمی‌شود.</small></section>;
}
