import {mkdir,rename,unlink,stat} from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {resolve,dirname,sep} from 'node:path';
import {randomUUID} from 'node:crypto';

export class DiskMedia {
  constructor(root){this.root=resolve(root);}
  path(key){
    if(!key||key.includes('\\')||key.includes('\0')||key.split('/').some(x=>!x||x==='.'||x==='..'))throw new Error('INVALID_MEDIA_KEY');
    const filename=resolve(this.root,key);
    if(!filename.startsWith(this.root+sep))throw new Error('INVALID_MEDIA_KEY');
    return filename;
  }
  async put(key,body){
    const filename=this.path(key);await mkdir(dirname(filename),{recursive:true});
    const temporary=filename+'.'+randomUUID()+'.tmp';
    let size=0;
    const hardLimit=Math.min(1024,Math.max(100,Number(process.env.HATAM_UPLOAD_HARD_LIMIT_MB)||512))*1024*1024;
    const limit=new Transform({transform(chunk,encoding,callback){size+=chunk.length;callback(size>hardLimit?new Error('FILE_TOO_LARGE'):null,chunk);}});
    try {
      const source=body instanceof ReadableStream?Readable.fromWeb(body):Readable.from([Buffer.from(body)]);
      await pipeline(source,limit,createWriteStream(temporary,{flags:'wx',mode:0o600}));
      await rename(temporary,filename);
    }catch(error){await unlink(temporary).catch(()=>{});throw error;}
    return {key,size};
  }
  async get(key,options){
    const filename=this.path(key);
    try{const info=await stat(filename);if(!info.isFile())return null;return {body:Readable.toWeb(createReadStream(filename,options?.range?{start:options.range.offset,end:Math.min(info.size-1,options.range.offset+options.range.length-1)}:undefined)),size:info.size};}
    catch(error){if(error.code==='ENOENT')return null;throw error;}
  }
  async delete(key){try{await unlink(this.path(key));}catch(error){if(error.code!=='ENOENT')throw error;}}
}
