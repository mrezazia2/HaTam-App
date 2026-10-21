import {and,asc,desc,eq,inArray} from "drizzle-orm";
import {getDb} from "../../../db";
import {chatReadReceipts,accounts,conversationParticipants,conversations,messages,notifications,smsOutbox} from "../../../db/schema";
import {getRequestAccount} from "../_lib/authorization";
import {writeAudit} from "../_lib/audit";

export const dynamic="force-dynamic";
const roles={user:["consultant","agency","admin"],consultant:["user","consultant","agency","admin"],agency:["user","consultant","admin"],admin:["user","consultant","agency","admin"]} as const;

async function conversationSummary(db:ReturnType<typeof getDb>,conversation:typeof conversations.$inferSelect,viewerId:string){
 const members=await db.select().from(conversationParticipants).where(eq(conversationParticipants.conversationId,conversation.id));
 const memberAccounts=members.length?await db.select({id:accounts.id,name:accounts.name,role:accounts.role,status:accounts.status}).from(accounts).where(inArray(accounts.id,members.map(x=>x.accountId))):[];
 const membership=members.find(x=>x.accountId===viewerId),thread=await db.select().from(messages).where(eq(messages.conversationId,conversation.id)).orderBy(desc(messages.createdAt));
 const receipt=(await db.select().from(chatReadReceipts).where(and(eq(chatReadReceipts.accountId,viewerId),eq(chatReadReceipts.conversationId,conversation.id))).limit(1))[0];
 const lastReadAt=receipt?.readAt||membership?.lastReadAt;
 const unread=thread.filter(x=>x.senderAccountId!==viewerId&&(!lastReadAt||x.createdAt>lastReadAt)&&x.moderationStatus!=="hidden").length;
 return {...conversation,participants:memberAccounts,lastMessage:thread[0]?{body:thread[0].moderationStatus==="hidden"?"پیام توسط مدیر مخفی شده است.":thread[0].body,createdAt:thread[0].createdAt}:null,unread};
}

export async function GET(request:Request){
 const account=await getRequestAccount(request);if(!account)return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});
 const db=getDb(),url=new URL(request.url),conversationId=url.searchParams.get("conversationId");
 if(conversationId){
  const members=await db.select().from(conversationParticipants).where(eq(conversationParticipants.conversationId,conversationId));
  if(account.role!=="admin"&&!members.some(x=>x.accountId===account.id))return Response.json({ok:false,error:"FORBIDDEN"},{status:403});
  const readAt=new Date();
  const rows=await db.select().from(messages).where(eq(messages.conversationId,conversationId)).orderBy(asc(messages.createdAt));
  const senderIds=Array.from(new Set(rows.map(x=>x.senderAccountId))),senders=senderIds.length?await db.select({id:accounts.id,name:accounts.name,role:accounts.role}).from(accounts).where(inArray(accounts.id,senderIds)):[];
  if(!members.length)return Response.json({ok:false,error:"NOT_FOUND"},{status:404});
  await db.insert(chatReadReceipts).values({id:`CR-${crypto.randomUUID()}`,accountId:account.id,conversationId,readAt}).onConflictDoUpdate({target:[chatReadReceipts.accountId,chatReadReceipts.conversationId],set:{readAt}});
  if(account.role!=="admin")await db.update(conversationParticipants).set({lastReadAt:readAt}).where(eq(conversationParticipants.id,members.find(x=>x.accountId===account.id)!.id));
  const visible=account.role==="admin"?rows:rows.filter(x=>x.moderationStatus!=="hidden");
  return Response.json({ok:true,items:visible.map(row=>({...row,sender:senders.find(x=>x.id===row.senderAccountId)||{id:row.senderAccountId,name:"کاربر حاتم",role:"user"}}))});
 }
 let rows:typeof conversations.$inferSelect[];
 if(account.role==="admin")rows=await db.select().from(conversations).orderBy(desc(conversations.updatedAt));
 else{const memberships=await db.select().from(conversationParticipants).where(eq(conversationParticipants.accountId,account.id));rows=memberships.length?await db.select().from(conversations).where(inArray(conversations.id,memberships.map(x=>x.conversationId))).orderBy(desc(conversations.updatedAt)):[]}
 return Response.json({ok:true,items:await Promise.all(rows.map(row=>conversationSummary(db,row,account.id)))});
}

export async function POST(request:Request){
 const account=await getRequestAccount(request);if(!account||account.status!=="active")return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});
 const value=await request.json() as {action?:string;participantAccountIds?:unknown[];kind?:"direct"|"property"|"visit"|"contract"|"support";subject?:string;propertyId?:string;agencyId?:string;conversationId?:string;body?:string},db=getDb(),timestamp=new Date();
 if(value.action==="create"){
  const requested=Array.from(new Set(Array.isArray(value.participantAccountIds)?value.participantAccountIds.map(String):[])).filter(Boolean),targets=requested.length?await db.select().from(accounts).where(inArray(accounts.id,requested)):[];
  if(targets.length!==requested.length||targets.some(x=>x.status!=="active"))return Response.json({ok:false,error:"PARTICIPANT_NOT_AVAILABLE"},{status:400});
  if(targets.some(target=>!roles[account.role as keyof typeof roles].includes(target.role as never)))return Response.json({ok:false,error:"ROLE_RELATION_FORBIDDEN"},{status:403});
  const participantIds=Array.from(new Set([account.id,...requested]));if(participantIds.length<2)return Response.json({ok:false,error:"PARTICIPANT_REQUIRED"},{status:400});
  const id=`CHAT-${crypto.randomUUID()}`,kind=["direct","property","visit","contract","support"].includes(String(value.kind))?(value.kind!):"direct",subject=String(value.subject||"گفت‌وگوی جدید").trim().slice(0,120)||"گفت‌وگوی جدید";
  await db.insert(conversations).values({id,kind,subject,propertyId:value.propertyId||null,agencyId:account.agencyId||value.agencyId||null,status:"open",createdAt:timestamp,updatedAt:timestamp});
  await db.insert(conversationParticipants).values(participantIds.map(accountId=>({id:`CP-${crypto.randomUUID()}`,conversationId:id,accountId,role:accountId===account.id?account.role:(targets.find(x=>x.id===accountId)?.role||"participant"),lastReadAt:accountId===account.id?timestamp:null,joinedAt:timestamp})));
  await writeAudit(db,account,"conversation.created","conversation",id,"گفت‌وگوی جدید ایجاد شد.",{participantIds,kind,propertyId:value.propertyId||null});return Response.json({ok:true,id},{status:201});
 }
 const conversationId=String(value.conversationId||""),body=String(value.body||"").trim();if(!conversationId||!body||body.length>4000)return Response.json({ok:false,error:"INVALID_MESSAGE"},{status:400});
 const conversation=(await db.select().from(conversations).where(eq(conversations.id,conversationId)).limit(1))[0];if(!conversation||conversation.status!=="open")return Response.json({ok:false,error:"CONVERSATION_NOT_OPEN"},{status:409});
 const participants=await db.select().from(conversationParticipants).where(eq(conversationParticipants.conversationId,conversationId));if(account.role!=="admin"&&!participants.some(x=>x.accountId===account.id))return Response.json({ok:false,error:"FORBIDDEN"},{status:403});
 const id=`MSG-${crypto.randomUUID()}`;await db.insert(messages).values({id,conversationId,senderAccountId:account.id,body,moderationStatus:"visible",createdAt:timestamp});await db.update(conversations).set({updatedAt:timestamp}).where(eq(conversations.id,conversationId));await writeAudit(db,account,"message.sent","message",id,"پیام درون‌برنامه‌ای ارسال شد.",{conversationId});
 const recipients=participants.filter(x=>x.accountId!==account.id);if(recipients.length){await db.insert(notifications).values(recipients.map(item=>({id:`N-${crypto.randomUUID()}`,accountId:item.accountId,type:"new_message",title:`پیام جدید از ${account.name}`,body:body.slice(0,160),link:`/${item.role==="user"?"panel":item.role}?chat=${encodeURIComponent(conversationId)}`,readAt:null,createdAt:timestamp})));const recipientAccounts=await db.select().from(accounts).where(inArray(accounts.id,recipients.map(x=>x.accountId)));if(recipientAccounts.length)await db.insert(smsOutbox).values(recipientAccounts.map(item=>({id:`SMS-${crypto.randomUUID()}`,accountId:item.id,mobile:item.mobile,template:"new-message",payload:{conversationId,sender:account.name},status:"pending" as const,attempts:0,createdAt:timestamp,sentAt:null})))}
 return Response.json({ok:true,id},{status:201});
}

export async function PATCH(request:Request){
 const account=await getRequestAccount(request);if(!account||account.status!=="active")return Response.json({ok:false,error:"AUTH_REQUIRED"},{status:401});const value=await request.json() as {conversationId?:string;status?:"open"|"closed"|"archived"},conversationId=String(value.conversationId||"");if(!conversationId||!value.status||!["open","closed","archived"].includes(value.status))return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400});const db=getDb(),members=await db.select().from(conversationParticipants).where(eq(conversationParticipants.conversationId,conversationId));if(account.role!=="admin"&&!members.some(x=>x.accountId===account.id))return Response.json({ok:false,error:"FORBIDDEN"},{status:403});await db.update(conversations).set({status:value.status,updatedAt:new Date()}).where(eq(conversations.id,conversationId));await writeAudit(db,account,"conversation.status_changed","conversation",conversationId,"وضعیت گفت‌وگو تغییر کرد.",{status:value.status});return Response.json({ok:true});
}
