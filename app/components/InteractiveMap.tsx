"use client";
import {useEffect,useRef,useState} from 'react';
import type {Map as LeafletMap,LayerGroup} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './interactive-map.css';
export type MapViewport={south:number;north:number;west:number;east:number;zoom:number};
export type MapPoint={id:string;latitude:number|null;longitude:number|null;label:string};
export const validCoordinates=(lat:unknown,lng:unknown)=>typeof lat==='number'&&typeof lng==='number'&&Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=25&&lat<=40&&lng>=44&&lng<=64;
export default function InteractiveMap({points=[],onSelect,onPick,onViewportChange,selectedId,center,radius=0,height=420}:{points?:MapPoint[];selectedId?:string|null;onViewportChange?:(viewport:MapViewport)=>void;onSelect?:(id:string)=>void;onPick?:(lat:number,lng:number)=>void;center?:[number,number];radius?:number;height?:number}){
 const fitted=useRef(''),container=useRef<HTMLDivElement>(null),map=useRef<LeafletMap|null>(null),layers=useRef<LayerGroup|null>(null),callbacks=useRef({onSelect,onPick,onViewportChange}),[ready,setReady]=useState(false),[error,setError]=useState('');
 useEffect(()=>{callbacks.current={onSelect,onPick,onViewportChange}},[onSelect,onPick,onViewportChange]);
 const [locating,setLocating]=useState(false);
 useEffect(()=>{let disposed=false;let observer:ResizeObserver|undefined;import('leaflet').then(L=>{if(disposed||!container.current)return;const instance=L.map(container.current,{scrollWheelZoom:false,zoomControl:true}).setView(center||[35.704,51.47],13);map.current=instance;L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).on('tileerror',()=>setError('بعضی کاشی‌های نقشه بارگذاری نشد؛ اتصال اینترنت را بررسی کنید.')).addTo(instance);layers.current=L.layerGroup().addTo(instance);instance.on('click',event=>callbacks.current.onPick?.(event.latlng.lat,event.latlng.lng));observer=new ResizeObserver(()=>instance.invalidateSize());observer.observe(container.current);setReady(true);}).catch(()=>setError('بارگذاری نقشه انجام نشد.'));return()=>{disposed=true;observer?.disconnect();map.current?.remove();map.current=null;layers.current=null;};},[]);
 const pointKey=JSON.stringify(points),centerKey=JSON.stringify(center);
 useEffect(()=>{
  if(!ready||!map.current||!layers.current)return;let cancelled=false;let draw:()=>void=()=>{};
  import('leaflet').then(L=>{
   if(cancelled||!map.current||!layers.current)return;const instance=map.current,group=layers.current;
   const valid=points.filter(p=>validCoordinates(p.latitude,p.longitude));
   if(center&&validCoordinates(...center))instance.setView(center,16);else if(valid.length&&fitted.current!==pointKey)instance.fitBounds(L.latLngBounds(valid.map(p=>[p.latitude!,p.longitude!] as [number,number])),{padding:[45,45],maxZoom:14});fitted.current=pointKey;
   draw=()=>{
    group.clearLayers();const zoom=instance.getZoom(),picker=Boolean(callbacks.current.onPick);
    const buckets=new Map<string,MapPoint[]>();for(const point of valid){const px=instance.project([point.latitude!,point.longitude!],zoom),cell=zoom<13?150:90;const key=picker||zoom>=17?point.id:Math.floor(px.x/cell)+':'+Math.floor(px.y/cell);buckets.set(key,[...(buckets.get(key)||[]),point]);}
    for(const bucket of buckets.values()){
     const lat=bucket.reduce((n,p)=>n+p.latitude!,0)/bucket.length,lng=bucket.reduce((n,p)=>n+p.longitude!,0)/bucket.length;
     const cluster=!picker&&(bucket.length>1||zoom<15),label=document.createElement('button');label.type='button';label.className=picker?'hatam-map-pin':cluster?'hatam-map-cluster':'hatam-map-marker';label.textContent=picker?'':cluster?bucket.length.toLocaleString('fa-IR'):bucket[0].label;if(bucket.some(p=>p.id===selectedId))label.classList.add('is-selected');label.setAttribute('aria-label',cluster?bucket.length.toLocaleString('fa-IR')+' ملک؛ برای جزئیات زوم کنید':bucket[0].label);
     const marker=L.marker([lat,lng],{icon:L.divIcon({html:label,className:picker?'hatam-map-pin-wrap':'hatam-map-marker-wrap',iconSize:picker?[36,46]:cluster?[54,54]:[110,38],iconAnchor:picker?[18,46]:cluster?[27,27]:[55,19]})}).addTo(group);
     marker.on('click',()=>cluster?instance.setView([lat,lng],Math.min(19,zoom+2)):callbacks.current.onSelect?.(bucket[0].id));
     if(radius>0&&picker)L.circle([lat,lng],{radius,color:'#12664b',fillOpacity:.12}).addTo(group);
    }
   };const report=()=>{const bounds=instance.getBounds();callbacks.current.onViewportChange?.({south:bounds.getSouth(),north:bounds.getNorth(),west:bounds.getWest(),east:bounds.getEast(),zoom:instance.getZoom()})};const render=draw;draw=()=>{render();report()};draw();instance.on('zoomend moveend',draw);
  });return()=>{cancelled=true;map.current?.off('zoomend moveend',draw)}
 },[ready,pointKey,centerKey,radius,selectedId]);
 const locate=()=>{if(!navigator.geolocation)return setError('مکان‌یابی در این مرورگر موجود نیست.');setLocating(true);navigator.geolocation.getCurrentPosition(p=>{map.current?.setView([p.coords.latitude,p.coords.longitude],16);callbacks.current.onPick?.(p.coords.latitude,p.coords.longitude);setLocating(false)},()=>{setError('اجازهٔ موقعیت داده نشد یا موقعیت دریافت نشد.');setLocating(false)},{timeout:10000});};
 return <div className="hatam-interactive-map"><div ref={container} style={{height}} aria-label={onPick?'نقشه انتخاب موقعیت؛ برای ثبت نقطه روی نقشه کلیک کنید':'نقشه املاک؛ با زوم نام محله‌ها و خیابان‌ها نمایش داده می‌شود'}/><button type="button" className="hatam-map-locate" onClick={locate} disabled={locating}>{locating?'در حال مکان‌یابی…':'موقعیت من'}</button>{error&&<p role="status">{error}</p>}<small>با دکمه‌های + و − یا دو انگشت، برای دیدن محله‌ها و معابر زوم کنید.</small></div>;
}
