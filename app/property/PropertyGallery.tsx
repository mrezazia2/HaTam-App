"use client";
import {useRef} from 'react';
type Media={key:string;url:string;type:string};
export default function PropertyGallery({items,index,onChange,title}:{items:Media[];index:number;onChange:(index:number)=>void;title:string}){
 const start=useRef<number|null>(null);
 const move=(delta:number)=>onChange((index+delta+items.length)%items.length);
 const current=items[index]||items[0];
 return <section className="property-gallery" aria-label="گالری ملک" aria-roledescription="اسلایدر">
  <div className="property-gallery-stage" onTouchStart={e=>{start.current=e.touches[0].clientX}} onTouchEnd={e=>{if(start.current!==null){const dx=e.changedTouches[0].clientX-start.current;if(Math.abs(dx)>45)move(dx>0?1:-1)}start.current=null}}>
   {current?.type.startsWith('video/')?<video key={current.key} src={current.url} controls playsInline preload="metadata"/>:<img src={current?.url} alt={title}/>}
   {items.length>1&&<><button type="button" className="gallery-prev" aria-label="رسانه قبلی" onClick={()=>move(-1)}>‹</button><button type="button" className="gallery-next" aria-label="رسانه بعدی" onClick={()=>move(1)}>›</button></>}
   <span className="gallery-count" aria-live="polite">{(index+1).toLocaleString('fa-IR')} / {items.length.toLocaleString('fa-IR')}</span>
  </div>
  {items.length>1&&<div className="property-gallery-thumbnails" aria-label="انتخاب رسانه">{items.map((item,i)=><button type="button" key={item.key} aria-label={`رسانه ${(i+1).toLocaleString('fa-IR')}`} aria-pressed={i===index} onClick={()=>onChange(i)}>{item.type.startsWith('video/')?<span>▶ ویدیو</span>:<img src={item.url} alt="" loading="lazy"/>}</button>)}</div>}
 </section>
}
