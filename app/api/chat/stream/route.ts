import {desc,eq} from "drizzle-orm";
import {getDb} from "../../../../db";
import {conversationParticipants,messages} from "../../../../db/schema";
import {getRequestAccount} from "../../_lib/authorization";

export const dynamic="force-dynamic";
export async function GET(request:Request){
 const url=new URL(request.url),headers=new Headers(request.headers),conversationId=url.searchParams.get("conversationId")||"";
 if((url.hostname==="localhost"||url.hostname==="127.0.0.1")&&url.searchParams.get("previewRole"))headers.set("x-hatam-preview-role",url.searchParams.get("previewRole")!);
 const account=await getRequestAccount(new Request(url.toString(),{headers}));if(!account||!conversationId)return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});
 const db=getDb(),members=await db.select().from(conversationParticipants).where(eq(conversationParticipants.conversationId,conversationId));if(account.role!=="admin"&&!members.some(x=>x.accountId===account.id))return Response.json({ok:false,error:"FORBIDDEN"},{status:403});
 const encoder=new TextEncoder();let stopped=false;request.signal.addEventListener("abort",()=>{stopped=true},{once:true});
 const stream=new ReadableStream<Uint8Array>({async start(controller){let signature="";const started=Date.now();while(!stopped&&Date.now()-started<25_000){try{const latest=(await db.select({id:messages.id,moderationStatus:messages.moderationStatus}).from(messages).where(eq(messages.conversationId,conversationId)).orderBy(desc(messages.createdAt)).limit(1))[0],next=`${latest?.id||""}:${latest?.moderationStatus||""}`;if(!signature)controller.enqueue(encoder.encode("retry: 1000\nevent: ready\ndata: {}\n\n"));if(signature&&next!==signature)controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify({changed:true})}\n\n`));signature=next}catch{controller.enqueue(encoder.encode("event: heartbeat\ndata: {}\n\n"))}await new Promise(resolve=>setTimeout(resolve,600))}if(!stopped)controller.close()},cancel(){stopped=true}});
 return new Response(stream,{headers:{"content-type":"text/event-stream; charset=utf-8","cache-control":"no-cache, no-transform","connection":"keep-alive","x-accel-buffering":"no"}});
}
