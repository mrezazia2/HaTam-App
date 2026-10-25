import {eq} from 'drizzle-orm';
import {getDb} from '../../../db';
import {appConfigurations} from '../../../db/schema';
export type CustomCode={css:string;js:string;cssEnabled:boolean;jsEnabled:boolean;target:'site'|'app'|'both';version:number};
export const emptyCustomCode:CustomCode={css:'',js:'',cssEnabled:false,jsEnabled:false,target:'both',version:0};
export async function customCode():Promise<CustomCode>{const row=(await getDb().select().from(appConfigurations).where(eq(appConfigurations.id,'custom-client-code')).limit(1))[0];return {...emptyCustomCode,...row?.value} as CustomCode}
export function codePrelude(target:CustomCode['target']){return `if(!/^(admin|consultant|agency|panel)\\./.test(location.hostname)&&!/^\\/(admin|consultant|agency|panel|login|register)(\\/|$)/.test(location.pathname)&&!new URLSearchParams(location.search).has('safeMode')&&(${JSON.stringify(target)}==='both'||(location.pathname.startsWith('/app')?${JSON.stringify(target)}==='app':${JSON.stringify(target)}==='site')))`}
