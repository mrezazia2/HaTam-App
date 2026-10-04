import {resolve,join} from 'node:path';
import {SqliteBinding} from './sqlite.mjs';
import {DiskMedia} from './media.mjs';

// Imported only by the VPS build. Cloudflare keeps its existing native bindings.
let database;
let media;
function dataDirectory(){return resolve(process.env.HATAM_DATA_DIR||'data');}
export const env=new Proxy({}, {get(_target,key){
  if(key==='DB')return database??=(new SqliteBinding(join(dataDirectory(),'hatam.sqlite')));
  if(key==='MEDIA')return media??=(new DiskMedia(join(dataDirectory(),'media')));
  if(key==='HATAM_PRESENTATION_MODE')return undefined;
  return process.env[key];
}});
