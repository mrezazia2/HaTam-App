"use client";
import {useEffect,useState} from "react";
import {Share2Icon} from "@radix-ui/react-icons";
import PublicSiteHeader from "../../site/PublicSiteHeader";
import SiteAdvisor from "../SiteAdvisor";
import SiteSimilarProperties from "../SiteSimilarProperties";
import PropertyActions from "./PropertyActions";
import {PropertyMap,PropertySections} from "../PropertySections";
import '../single-app-layout.css';
type PropertyData={id:string;title:string;address:string;area:number;bedrooms:number;price:number;description:string;coverImage:string|null;transactionType:string;latitude:number|null;longitude:number|null;media:{key:string;url:string;name:string;type:string}[]};
export default function PropertyDetail({property}:{property:PropertyData}){
 const [notice,setNotice]=useState(''),[activeMedia,setActiveMedia]=useState(0),[note,setNote]=useState('');
 useEffect(()=>{window.scrollTo({top:0,behavior:"instant"});setActiveMedia(0);try{setNote(localStorage.getItem(`hatam-property-note:${property.id}`)||'')}catch{}},[property.id]);
 const gallery=property.media.length?property.media:[{key:'cover',url:property.coverImage||'/assets/hatam/luxury-living.webp',name:property.title,type:'image/webp'}],active=gallery[Math.min(activeMedia,gallery.length-1)];
 const notify=(value:string)=>setNotice(value);
 const share=async()=>{try{if(navigator.share)await navigator.share({title:property.title,url:location.href});else{await navigator.clipboard.writeText(location.href);notify('لینک ملک کپی شد.')}}catch{notify('اشتراک‌گذاری کامل نشد.')}};
 return <main className="single-property" dir="rtl"><PublicSiteHeader/><div className="single-layout"><article className="single-info"><h1>{property.title}</h1><p className="single-address">{property.address}</p><p>قبل از معامله، هویت طرفین و مدارک ملک را بررسی کنید.</p><div className="single-actions"><PropertyActions propertyId={property.id} notify={notify}/><button onClick={share} aria-label="اشتراک‌گذاری ملک"><Share2Icon/></button></div><PropertySections area={property.area} bedrooms={property.bedrooms} price={property.price} transactionType={property.transactionType} description={property.description}/><SiteAdvisor propertyId={property.id}/></article><aside className="single-media"><div className="single-gallery-image">{active.type.startsWith('video/')?<video src={active.url} controls playsInline/>:<img src={active.url} alt={property.title}/>}<span>{(activeMedia+1).toLocaleString('fa-IR')} / {gallery.length.toLocaleString('fa-IR')}</span></div><div className="single-gallery-thumbs">{gallery.map((item,index)=><button key={item.key} className={activeMedia===index?'active':''} onClick={()=>setActiveMedia(index)} aria-label={`نمایش رسانه ${(index+1).toLocaleString('fa-IR')}`}>{item.type.startsWith('video/')?<video src={item.url} muted/>:<img src={item.url} alt={item.name}/>}</button>)}</div><label className="single-notes">یادداشت شخصی<textarea maxLength={2000} value={note} placeholder="یادداشت شما…" onChange={e=>{setNote(e.target.value);try{localStorage.setItem(`hatam-property-note:${property.id}`,e.target.value)}catch{notify('ذخیرهٔ یادداشت روی این دستگاه ممکن نیست.')}}}/><small>فقط روی همین مرورگر ذخیره می‌شود و برای مشاور ارسال نمی‌شود.</small></label><PropertyMap latitude={property.latitude} longitude={property.longitude}/></aside></div><SiteSimilarProperties id={property.id} transactionType={property.transactionType}/>{notice&&<p className="property-toast" role="status">{notice}</p>}</main>;
}
