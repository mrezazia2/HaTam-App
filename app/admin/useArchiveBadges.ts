"use client";
import {useEffect,useState} from 'react';
export function useArchiveBadges(active:string,ready=true){
 const [counts,setCounts]=useState<Record<string,number>>({});
 useEffect(()=>{let disposed=false;const load=async(mark=false)=>{try{const response=await fetch('/api/admin/archive-badges',{cache:'no-store'});if(!response.ok)return;const data=await response.json();if(disposed)return;setCounts(data.counts);if(mark&&ready&&Object.hasOwn(data.counts,active)){const saved=await fetch('/api/admin/archive-badges',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({section:active,through:data.snapshot})});if(saved.ok&&!disposed)setCounts(current=>({...current,[active]:0}))}}catch{}};load(true);const timer=setInterval(()=>load(),30000);return()=>{disposed=true;clearInterval(timer)}},[active,ready]);return counts;
}
