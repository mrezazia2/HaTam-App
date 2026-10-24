"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
type Advisor={id:string;name:string;mobile:string};
export default function SiteAdvisor({propertyId}:{propertyId:string}){
 const [advisor,setAdvisor]=useState<Advisor|null>(null),[phone,setPhone]=useState("");
 useEffect(()=>{const controller=new AbortController();fetch("/api/properties/"+encodeURIComponent(propertyId),{signal:controller.signal,cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>setAdvisor(d?.advisor||null)).catch(()=>{});fetch("/api/contact",{signal:controller.signal}).then(r=>r.ok?r.json():null).then(d=>{const values=d?.config?.phones||d?.phones||[];if(typeof values[0]==="string")setPhone(values[0].replace(/\s/g,""))}).catch(()=>{});return()=>controller.abort()},[propertyId]);
 return <section className="site-property-advisor" style={{padding:20,marginTop:18,border:"1px solid var(--theme-border)",borderRadius:16}}><h2>مشاور این ملک</h2>{advisor?<><Link href={"/consultants/"+encodeURIComponent(advisor.id)}>{advisor.name}</Link><a className="property-action" href={"tel:"+advisor.mobile}>تماس با مشاور</a></>:<><p>هماهنگی از طریق دفتر حاتم</p>{phone?<a href={"tel:"+phone}>تماس با دفتر</a>:<Link href="/contact">اطلاعات تماس دفتر</Link>}</>}</section>;
}
