import type {PropertyMedia} from './PropertyMediaUploader';
export async function uploadPropertyFile(file:File,role:string):Promise<PropertyMedia>{
 if(file.size>8*1024*1024){
  const headers={'content-type':'application/json','x-hatam-preview-role':role};
  const init=await fetch('/api/property-media/chunks?action=init',{method:'POST',headers,body:JSON.stringify({name:file.name,type:file.type,size:file.size})});
  const session=await init.json();if(!init.ok)throw Error(session.error||'UPLOAD_FAILED');
  for(let offset=0;offset<session.parts;offset+=2){
   await Promise.all(Array.from({length:Math.min(2,session.parts-offset)},async(_,n)=>{
    const i=offset+n;let sent=false;
    for(let attempt=0;attempt<3&&!sent;attempt++){try{const part=await fetch(`/api/property-media/chunks?action=part&id=${encodeURIComponent(session.id)}&part=${i}`,{method:'POST',headers:{'content-type':'application/octet-stream','x-hatam-preview-role':role},body:file.slice(i*session.partSize,(i+1)*session.partSize)});if(!part.ok)throw Error('UPLOAD_FAILED');sent=true}catch{if(attempt===2)throw Error('UPLOAD_FAILED')}}
   }));
  }
  const complete=await fetch(`/api/property-media/chunks?action=complete&id=${encodeURIComponent(session.id)}`,{method:'POST',headers});const result=await complete.json();if(!complete.ok)throw Error(result.error||'UPLOAD_FAILED');return result.item;
 }
 const data=new FormData();data.set('file',file);
 const response=await fetch('/api/property-media',{method:'POST',headers:{'x-hatam-preview-role':role},body:data});
 const result=await response.json();if(!response.ok)throw Error(result.error||'UPLOAD_FAILED');return result.item;
}
export async function flushPropertyMedia(items:PropertyMedia[],role:string,onProgress?:(items:PropertyMedia[])=>void){
 const result:PropertyMedia[]=[];
 for(const [index,item] of items.entries()){if(item.file){const uploaded=await uploadPropertyFile(item.file,role);URL.revokeObjectURL(item.url);result.push(uploaded);onProgress?.([...result,...items.slice(index+1)])}else result.push(item)}return result;
}
