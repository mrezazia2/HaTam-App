import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join,basename} from 'node:path';

// Vite can eliminate a CSS-only JS chunk after the RSC plugin has recorded it.
// Remove only those empty-chunk references; real missing executables fail build.
export function verifyRscAssets(outDir=resolve('dist')){
 const client=join(outDir,'client'),cssDir=join(client,'_next/static/css');
 const viteManifest=JSON.parse(readFileSync(join(client,'.vite/manifest.json'),'utf8'));
 const css=existsSync(cssDir)?readdirSync(cssDir):[];let removed=0;
 for(const relative of ['server/__vite_rsc_assets_manifest.js','server/ssr/__vite_rsc_assets_manifest.js']){
  const file=join(outDir,relative);if(!existsSync(file))throw Error(`RSC manifest missing: ${relative}`);
  const manifest=JSON.parse(readFileSync(file,'utf8').replace(/^export default\s*/, '').replace(/;\s*$/,''));
  const visit=value=>{if(!value||typeof value!=='object')return;
   if(Array.isArray(value.js))value.js=value.js.filter(url=>{
    if(!url.startsWith('/_next/')||existsSync(join(client,url)))return true;
    const linkedCss=Array.isArray(value.css)?value.css:[];
    const executable=Object.values(viteManifest).some(entry=>entry.file===url.slice(1));
    const cssOnly=!executable&&css.some(name=>basename(url).startsWith(name.replace(/\.[^.]+\.css$/,'')+'-')&&url.endsWith('.js')&&linkedCss.some(href=>href.endsWith('/'+name)));
    if(!cssOnly)throw Error(`Missing executable asset: ${url}`);
    removed++;return false;
   });
   for(const child of Object.values(value))visit(child);
  };visit(manifest);
  if(manifest.clientEntryUrl&&!existsSync(join(client,manifest.clientEntryUrl)))throw Error('RSC client entry missing');
  writeFileSync(file,'export default '+JSON.stringify(manifest,null,2)+'\n');
 }
 return removed;
}
