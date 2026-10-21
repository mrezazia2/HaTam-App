import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
test('guest files upload two at a time and preserve successful results on failure',async()=>{
 const progressCode=ts.transpileModule(await readFile('app/components/upload-progress.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText,progressUrl='data:text/javascript;base64,'+Buffer.from(progressCode).toString('base64');
 const code=ts.transpileModule(await readFile('app/components/upload-property-media.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText.replace("'./upload-progress'",JSON.stringify(progressUrl));
 const {flushPropertyMedia}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));const original=globalThis.fetch;let active=0,peak=0,latest;
 globalThis.fetch=async(url,options)=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,10));active--;const file=options.body.get('file');return Response.json(file.name==='bad.jpg'?{error:'UPLOAD_FAILED'}:{item:{key:file.name,url:'/image',name:file.name,type:file.type,size:4}},{status:file.name==='bad.jpg'?500:201})};
 try{const items=['one.jpg','bad.jpg','three.jpg'].map(name=>({key:'local-'+name,url:'blob:'+name,name,type:'image/jpeg',size:4,file:new File(['test'],name,{type:'image/jpeg'})}));await assert.rejects(flushPropertyMedia(items,'user',v=>latest=v));assert.equal(peak,2);assert.equal(latest[0].key,'one.jpg');assert.equal(latest[1].file.name,'bad.jpg');assert.equal(latest[2].key,'three.jpg')}finally{globalThis.fetch=original}
});
