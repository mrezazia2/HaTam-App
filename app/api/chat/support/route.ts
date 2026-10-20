import {and,eq} from 'drizzle-orm';
import {getDb} from '../../../../db';
import {accounts,conversations,conversationParticipants} from '../../../../db/schema';
import {getRequestAccount} from '../../_lib/authorization';
import {writeAudit} from '../../_lib/audit';
export async function POST(request:Request){
 const account=await getRequestAccount(request);if(!account||account.status!=='active')return Response.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
 const db=getDb(),admin=(await db.select().from(accounts).where(and(eq(accounts.role,'admin'),eq(accounts.status,'active'),eq(accounts.mobile,'09102773989'))).limit(1))[0];
 if(!admin||admin.id===account.id)return Response.json({ok:false,error:'SUPPORT_NOT_AVAILABLE'},{status:409});
 const memberships=await db.select().from(conversationParticipants).where(eq(conversationParticipants.accountId,account.id));
 for(const member of memberships){const conversation=(await db.select().from(conversations).where(and(eq(conversations.id,member.conversationId),eq(conversations.kind,'support'),eq(conversations.status,'open'))).limit(1))[0];if(conversation){const recipients=await db.select().from(conversationParticipants).where(eq(conversationParticipants.conversationId,conversation.id));if(recipients.some(p=>p.accountId===admin.id))return Response.json({ok:true,id:conversation.id});}}
 const id='CHAT-'+crypto.randomUUID(),now=new Date();await db.insert(conversations).values({id,kind:'support',subject:'گفت‌وگو با مدیریت حاتم',status:'open',createdAt:now,updatedAt:now});await db.insert(conversationParticipants).values([account,admin].map(p=>({id:'CP-'+crypto.randomUUID(),conversationId:id,accountId:p.id,role:p.role,joinedAt:now,lastReadAt:null})));await writeAudit(db,account,'conversation.created','conversation',id,'گفت‌وگو با مدیریت ایجاد شد.',{kind:'support',participantIds:[account.id,admin.id]});return Response.json({ok:true,id},{status:201});
}
