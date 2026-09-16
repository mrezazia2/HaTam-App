import { desc,eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { notifications } from "../../../../db/schema";
import { getRequestAccount } from "../../_lib/authorization";

export const dynamic="force-dynamic";

export async function GET(request:Request){
 const url=new URL(request.url),headers=new Headers(request.headers);
 if((url.hostname==="localhost"||url.hostname==="127.0.0.1")&&url.searchParams.get("previewRole"))headers.set("x-hatam-preview-role",url.searchParams.get("previewRole")!);
 const account=await getRequestAccount(new Request(url.toString(),{headers}));
 if(!account)return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});
 const encoder=new TextEncoder();let stopped=false;
 request.signal.addEventListener("abort",()=>{stopped=true},{once:true});
 const stream=new ReadableStream<Uint8Array>({
  async start(controller){
   let signature="";const started=Date.now();
   controller.enqueue(encoder.encode("retry: 1000\nevent: ready\ndata: {}\n\n"));
   while(!stopped&&Date.now()-started<25_000){
    try{const items=await getDb().select({id:notifications.id,readAt:notifications.readAt}).from(notifications).where(eq(notifications.accountId,account.id)).orderBy(desc(notifications.createdAt)).limit(50);const next=`${items[0]?.id||""}:${items.filter(item=>!item.readAt).length}:${items[0]?.readAt?.getTime()||0}`;if(signature&&next!==signature)controller.enqueue(encoder.encode(`event: notification\ndata: ${JSON.stringify({changed:true})}\n\n`));signature=next}
    catch{controller.enqueue(encoder.encode("event: heartbeat\ndata: {}\n\n"))}
    await new Promise(resolve=>setTimeout(resolve,750));
   }
   if(!stopped)controller.close();
  },cancel(){stopped=true},
 });
 return new Response(stream,{headers:{"content-type":"text/event-stream; charset=utf-8","cache-control":"no-cache, no-transform","connection":"keep-alive","x-accel-buffering":"no"}});
}
