import {resolve,join} from 'node:path';
import {existsSync} from 'node:fs';
import {SqliteBinding} from '../runtime/sqlite.mjs';

const action=process.argv[2];
if(Number(process.versions.node.split('.')[0])<24)throw new Error('VPS runtime requires Node.js 24 or newer');
if(!['build','start','migrate'].includes(action))throw new Error('Usage: node scripts/vps.mjs build|start|migrate');
process.env.HATAM_RUNTIME='vps';
if(action!=='build'){
  for(const name of ['AUTH_SECRET','INTEGRATION_SECRET_KEY','AUTOMATION_SECRET'])if((process.env[name]||'').length<32)throw new Error(`Required secret missing or too short: ${name}`);
  if(process.env.HATAM_PRESENTATION_MODE)throw new Error('Presentation mode must be disabled on VPS');
  const db=new SqliteBinding(join(resolve(process.env.HATAM_DATA_DIR||'data'),'hatam.sqlite'));
  try{db.migrate(resolve('drizzle'));}finally{db.close();}
}
if(action==='build'){
  const {spawn}=await import('node:child_process');
  const child=spawn(process.execPath,['node_modules/vinext/dist/cli.js','build',...process.argv.slice(3)],{stdio:'inherit',env:process.env});
  for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
  child.on('error',()=>{process.exitCode=1;});
  child.on('exit',async code=>{process.exitCode=code??1;if(code===0){try{const {verifyRscAssets}=await import('./verify-rsc-assets.mjs');console.log(`RSC assets verified; removed ${verifyRscAssets()} CSS-only JS references`);}catch(error){console.error(error);process.exitCode=1;}}});
} else if(action==='start') {
  const args=process.argv.slice(3),option=(name,fallback)=>{const index=args.indexOf(name);return index>=0&&args[index+1]?args[index+1]:fallback;};
  const host=option('--hostname','0.0.0.0'),port=Number(option('--port','3000'));
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid --port');
  const productionServer=existsSync(resolve('vendor/vinext/dist/server/prod-server.js'))?'../vendor/vinext/dist/server/prod-server.js':'vinext/server/prod-server';
  const {startProdServer}=await import(productionServer);
  const {server}=await startProdServer({host,port,outDir:resolve(process.env.VINEXT_OUT_DIR||'dist')});
  for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
