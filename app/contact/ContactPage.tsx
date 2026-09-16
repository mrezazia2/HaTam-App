"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {CameraIcon,ChatBubbleIcon,ChevronRightIcon,DrawingPinFilledIcon,EnvelopeClosedIcon,ExternalLinkIcon,GlobeIcon,MobileIcon,PaperPlaneIcon} from "@radix-ui/react-icons";
import {useBrand} from "../brand/BrandProvider";
import {defaultContactConfig,type ContactConfig} from "./config";
import "./contact.css";
import "./contact-fix.css";

const mapIcons={neshan:DrawingPinFilledIcon,google:GlobeIcon,balad:DrawingPinFilledIcon};
const socialIcons={bale:EnvelopeClosedIcon,whatsapp:ChatBubbleIcon,instagram:CameraIcon,telegram:PaperPlaneIcon};
const tel=(value:string)=>value.replace(/[^\d+]/g,"");
export default function ContactPage(){const {settings}=useBrand(),[config,setConfig]=useState<ContactConfig>(defaultContactConfig);useEffect(()=>{fetch("/api/contact").then(r=>r.json()).then(data=>data.config&&setConfig(data.config)).catch(()=>{})},[]);return <main className="contact-page" dir="rtl"><header className="contact-topbar"><Link href="/app" aria-label="بازگشت"><ChevronRightIcon/></Link><strong>{config.title}</strong><Link href="/app" className="contact-logo"><img src={settings.logoUrl} alt={settings.brandName}/></Link></header><section className="contact-card"><div className="contact-heading"><span>در کنار شما</span><h1>{config.title}</h1><p>{config.intro}</p></div><div className="contact-address"><DrawingPinFilledIcon/><div><strong>{config.addressLabel}:</strong><p>{config.address}</p></div></div><div className="contact-map-links">{config.maps.filter(x=>x.enabled&&x.url).map(item=>{const Icon=mapIcons[item.id as keyof typeof mapIcons]||DrawingPinFilledIcon;return <a key={item.id} href={item.url} target="_blank" rel="noreferrer"><Icon/><span>{item.label}</span><ExternalLinkIcon/></a>})}</div><div className="contact-divider"/><section className="contact-phones"><h2>شماره تماس</h2>{config.phones.map(phone=><a key={phone} href={`tel:${tel(phone)}`} dir="ltr"><MobileIcon/><span>{phone}</span></a>)}</section><div className="contact-divider"/><section className="contact-social"><h2>شبکه‌های اجتماعی</h2><div>{config.socials.filter(x=>x.enabled&&x.url).map(item=>{const Icon=socialIcons[item.id as keyof typeof socialIcons]||GlobeIcon;return <a key={item.id} href={item.url} target="_blank" rel="noreferrer" aria-label={item.label}><Icon/><span>{item.label}</span></a>})}</div></section></section><p className="contact-signature">مسیر روشن، کار جمع</p></main>}
