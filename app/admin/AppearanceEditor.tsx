"use client";

import {useState} from "react";
import {useBrand} from "../brand/BrandProvider";
import type {AppearancePalette,AppearanceScope} from "../brand/appearance";

const scopes:Partial<Record<AppearanceScope,string>>={site:"سایت اصلی",app:"اپ و وب‌اپ",user:"پنل مشتری",consultant:"پنل مشاور",agency:"پنل آژانس",admin:"پنل ادمین"};
const visibleScopes:AppearanceScope[]=["site","app","user","consultant","agency","admin"];
const paletteLabels:Record<keyof AppearancePalette,string>={background:"پس‌زمینه",surface:"سطح کارت‌ها",text:"رنگ نوشته",primary:"رنگ اصلی",accent:"رنگ تأکیدی"};

export default function AppearanceEditor(){
 const {draft,setDraft}=useBrand();
 const [scope,setScope]=useState<AppearanceScope>("site");
 const current=draft.appearance[scope];
 const update=(patch:Partial<typeof current>)=>setDraft(previous=>({...previous,appearance:{...previous.appearance,[scope]:{...previous.appearance[scope],...patch}}}));
 const updateColor=(mode:"light"|"dark",key:keyof AppearancePalette,value:string)=>update({[mode]:{...current[mode],[key]:value}});
 return <section className="settings-card appearance-editor" id="appearance">
  <div className="settings-heading"><span>03</span><div><h2>ظاهر مستقل هر محصول</h2><p>فونت و رنگ‌های روشن و تیره را برای سایت، اپ و هر پنل جداگانه تنظیم کنید.</p></div></div>
  <div className="appearance-tabs" role="tablist" aria-label="انتخاب رابط">{visibleScopes.map(key=><button type="button" role="tab" aria-selected={scope===key} className={scope===key?"active":""} key={key} onClick={()=>setScope(key)}>{scopes[key]}</button>)}</div>
  <div className="field-grid type-fields"><label><span>خانواده فونت {scopes[scope]}</span><select value={current.fontFamily} onChange={event=>update({fontFamily:event.target.value})}><option value="Vazirmatn">وزیرمتن</option><option value="Tahoma">Tahoma</option><option value="Arial">Arial</option></select></label><label><span>اندازه فونت: {current.fontScale.toFixed(2)}×</span><input type="range" min="0.85" max="1.4" step="0.05" value={current.fontScale} onChange={event=>update({fontScale:Number(event.target.value)})}/></label></div>
  {(["light","dark"] as const).map(mode=><div className="appearance-palette" key={mode}><h3>{mode==="light"?"حالت روشن":"حالت تیره"}</h3><div>{(Object.keys(paletteLabels) as (keyof AppearancePalette)[]).map(key=><label key={key}><span>{paletteLabels[key]}</span><input type="color" value={current[mode][key]} onChange={event=>updateColor(mode,key,event.target.value)}/><code dir="ltr">{current[mode][key]}</code></label>)}</div></div>)}
  <p className="appearance-hint">تغییرها پس از ذخیره در تمام دستگاه‌ها از API مرکزی خوانده می‌شوند. ساختار سایت و اپ مستقل می‌ماند.</p>
 </section>;
}
