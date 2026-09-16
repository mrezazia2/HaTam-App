import { env } from "cloudflare:workers";

export const dynamic="force-dynamic";

export async function GET(){
 const bindings=env as unknown as {DB?:D1Database;MEDIA?:R2Bucket;AUTH_SECRET?:string;INTEGRATION_SECRET_KEY?:string;AUTOMATION_SECRET?:string};
 let database=false;
 try{database=Boolean(await bindings.DB?.prepare("SELECT 1 AS ok").first())}catch{database=false}
 const checks={database,media:Boolean(bindings.MEDIA),authSecret:Boolean(bindings.AUTH_SECRET),integrationSecret:Boolean(bindings.INTEGRATION_SECRET_KEY),automationSecret:Boolean(bindings.AUTOMATION_SECRET)},ready=Object.values(checks).every(Boolean);
 return Response.json({ok:ready,status:ready?"ready":"not_ready",checks,checkedAt:new Date().toISOString()},{status:ready?200:503,headers:{"cache-control":"no-store"}});
}
