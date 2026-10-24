import type {PropertyMedia} from './PropertyMediaUploader';
import {uploadRequest,type UploadProgress} from './upload-progress';
type Session={id:string;partSize:number;parts:number;done:Set<number>};
const sessions=new WeakMap<File,Session>();
export async function uploadPropertyFile(file:File,role:string,onProgress?:(progress:UploadProgress)=>void):Promise<PropertyMedia>{
 let lastPercent=0;const report=(percent:number,state:UploadProgress['state']='uploading')=>{lastPercent=Math.max(lastPercent,percent);percent=lastPercent;onProgress?.({percent,state});if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('hatam:upload-progress',{detail:{file,percent,state}}))};
 let storageKey="";
 try{
 if(file.size>2*1024*1024){
  const headers={'content-type':'application/json','x-hatam-preview-role':role};
  if(typeof localStorage!=='undefined'&&typeof crypto.subtle!=='undefined'){const sample=await new Blob([file.slice(0,65536),file.slice(-65536)]).arrayBuffer();const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',sample))).map(x=>x.toString(16).padStart(2,'0')).join('');storageKey='hatam-upload-'+role+'-'+file.size+'-'+digest}
  let session=sessions.get(file);if(!session&&storageKey){try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&saved.expires>Date.now())session={id:saved.id,parts:saved.parts,partSize:saved.partSize,done:new Set<number>()}}catch{}}
  if(session){const check=await fetch('/api/property-media/chunks?action=status&id='+encodeURIComponent(session.id),{method:'POST',headers});if(check.ok){const d=await check.json();if(d.item){if(storageKey)localStorage.removeItem(storageKey);report(100,'complete');return d.item}session.done=new Set(d.completed||[])}else{sessions.delete(file);session=undefined}}
  if(!session){const init=await fetch('/api/property-media/chunks?action=init',{method:'POST',headers,body:JSON.stringify({name:file.name,type:file.type,size:file.size,partSize:1024*1024})});const d=await init.json();if(!init.ok)throw Error(d.error||'UPLOAD_FAILED');session={...d,done:new Set<number>()};sessions.set(file,session!);if(storageKey){try{localStorage.setItem(storageKey,JSON.stringify({...session,done:undefined,expires:Date.now()+55*60000}))}catch{}}}
  const current=session!,sizes=new Map<number,number>();const update=()=>{let loaded=0;for(let i=0;i<current.parts;i++)loaded+=current.done.has(i)?Math.min(current.partSize,file.size-i*current.partSize):(sizes.get(i)||0);report(Math.min(99,Math.floor(loaded/file.size*100)))};
  const pending=Array.from({length:current.parts},(_,i)=>i).filter(i=>!current.done.has(i));update();
  for(let offset=0;offset<pending.length;offset+=2)await Promise.all(pending.slice(offset,offset+2).map(async i=>{for(let attempt=0;attempt<3;attempt++){try{await uploadRequest(`/api/property-media/chunks?action=part&id=${encodeURIComponent(current.id)}&part=${i}`,file.slice(i*current.partSize,(i+1)*current.partSize),{'content-type':'application/octet-stream','x-hatam-preview-role':role},loaded=>{sizes.set(i,loaded);update()});current.done.add(i);sizes.delete(i);update();return}catch(e){sizes.delete(i);if(attempt===2)throw e;await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)))}}}));
  let response:Response|undefined,d:Record<string,any>={};for(let attempt=0;attempt<3;attempt++){response=await fetch('/api/property-media/chunks?action=complete&id='+encodeURIComponent(current.id),{method:'POST',headers});d=await response.json();if(response.ok)break;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)))}if(!response?.ok)throw Error(d.error||'UPLOAD_FAILED');if(storageKey)localStorage.removeItem(storageKey);report(100,'complete');return d.item;
 }
 const data=new FormData();data.set('file',file);const result=await uploadRequest('/api/property-media',data,{'x-hatam-preview-role':role},(loaded,total)=>report(Math.min(99,Math.floor(loaded/total*100))));report(100,'complete');return result.item;
 }catch(error){report(0,'failed');throw error}
}
export async function flushPropertyMedia(items:PropertyMedia[],role:string,onProgress?:(items:PropertyMedia[])=>void){
 const result=[...items];let cursor=0;const failures:unknown[]=[];
 const worker=async()=>{while(cursor<items.length){const index=cursor++,item=items[index];if(!item.file)continue;try{result[index]=await uploadPropertyFile(item.file,role);URL.revokeObjectURL(item.url);onProgress?.([...result])}catch(error){failures.push(error)}}};
 await Promise.all([worker(),worker()]);if(failures.length)throw failures[0];return result;
}
