export type UploadProgress={percent:number;state:'uploading'|'complete'|'failed'|'staged'};
import type {PropertyMedia} from './PropertyMediaUploader';
export function uploadRequest(url:string,body:XMLHttpRequestBodyInit,headers:Record<string,string>,progress:(loaded:number,total:number)=>void):Promise<{item:PropertyMedia;ok?:boolean;error?:string}>{
 if(typeof XMLHttpRequest==='undefined')return fetch(url,{method:'POST',headers,body:body as BodyInit}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'UPLOAD_FAILED');return d});
 return new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('POST',url);xhr.timeout=180000;for(const [key,value]of Object.entries(headers))xhr.setRequestHeader(key,value);xhr.upload.onprogress=e=>{if(e.lengthComputable)progress(e.loaded,e.total)};xhr.onerror=()=>reject(Error('UPLOAD_INTERRUPTED'));xhr.ontimeout=()=>reject(Error('UPLOAD_INTERRUPTED'));xhr.onload=()=>{let data;try{data=JSON.parse(xhr.responseText)}catch{reject(Error('INVALID_UPLOAD_RESPONSE'));return}if(xhr.status>=200&&xhr.status<300)resolve(data);else reject(Error(data.error||'UPLOAD_FAILED'))};xhr.send(body)});
}
