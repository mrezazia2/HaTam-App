"use client";
import {useEffect,useState} from 'react';
import './managed-content.css';
import {managedPageSlug} from './managed-pages';
type Page={title:string;blocks:{id:string;title:string;body:string;type:string}[]};
export default function ManagedSiteContent({slug,onTitle}:{slug?:string;onTitle?:(title:string)=>void}){
 const [page,setPage]=useState<Page|null>(null);
 useEffect(()=>{const controller=new AbortController(),key=slug||managedPageSlug(location.pathname);fetch('/api/content/'+encodeURIComponent(key),{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)return;const d=await r.json();if(d.page?.target==='site'){setPage(d.page);onTitle?.(d.page.title)}}).catch(()=>{});return()=>controller.abort()},[slug,onTitle]);
 if(!page?.blocks.length)return null;
 return <section className="managed-site-content" dir="rtl">{page.blocks.map(block=><section key={block.id}><h2>{block.title}</h2>{block.type==='features'?<ul>{block.body.split('|').map((text,i)=><li key={i}>{text}</li>)}</ul>:<p style={{whiteSpace:'pre-line'}}>{block.body}</p>}</section>)}</section>;
}
