import {and,eq} from 'drizzle-orm';
import {getDb} from '../../../db';
import {accounts,integrationSettings,notifications,properties,propertyRequests,subscriptionPlans,subscriptions} from '../../../db/schema';
import {publicProperty} from '../_lib/public-property';
import {hasVipAccess} from '../_lib/vip-access';
import {getRequestAccount} from '../_lib/authorization';
import {writeAudit} from '../_lib/audit';
import {gatewayAvailable} from '../_lib/payment-config';
import {activeVipSubscription,validateVipRequest} from '../../vip/validation';
export const dynamic='force-dynamic';
async function membership(id:string){const rows=await getDb().select().from(subscriptions).where(eq(subscriptions.accountId,id));return rows.some(row=>activeVipSubscription(row))}
export async function GET(request:Request){const db=getDb(),account=await getRequestAccount(request),gateway=(await db.select().from(integrationSettings).where(eq(integrationSettings.category,'payment_gateway')).limit(1))[0];const member=await hasVipAccess(account);return Response.json({ok:true,items:member?(await db.select().from(properties).where(eq(properties.status,'vip'))).map(publicProperty):[],signedIn:Boolean(account),role:account?.role||null,member,paymentAvailable:gatewayAvailable(gateway),plans:await db.select({id:subscriptionPlans.id,name:subscriptionPlans.name,price:subscriptionPlans.price,durationDays:subscriptionPlans.durationDays}).from(subscriptionPlans).where(and(eq(subscriptionPlans.audience,'user'),eq(subscriptionPlans.active,true)))},{headers:{'cache-control':'private, no-store'}})}
export async function POST(request:Request){
 const account=await getRequestAccount(request);if(!account||account.status!=='active'||account.role!=='user')return Response.json({ok:false,message:'با حساب مشتری وارد شوید.'},{status:401});
 if(!await membership(account.id))return Response.json({ok:false,message:'برای ثبت درخواست کلاب VIP، اشتراک فعال لازم است.'},{status:403});
 let body:Record<string,unknown>;try{body=await request.json();if(!body||typeof body!=='object'||Array.isArray(body))throw Error()}catch{return Response.json({ok:false,message:'اطلاعات درخواست معتبر نیست.'},{status:400})}
 const value=validateVipRequest(body);if(!value.ok)return Response.json(value,{status:400});
 const db=getDb(),id=`REQ-${crypto.randomUUID()}`,now=new Date(),title=`خرید VIP ـ ${value.firstName} ${value.lastName}`,description=JSON.stringify({source:'vip',...value,ok:undefined});
 await db.insert(propertyRequests).values({id,requestType:'buy',customerAccountId:account.id,title,district:value.regions.join('، ')||null,minBudget:value.minBudget,maxBudget:value.maxBudget,description,status:'new',createdBy:account.id,createdAt:now,updatedAt:now});
 const admins=await db.select({id:accounts.id}).from(accounts).where(and(eq(accounts.role,'admin'),eq(accounts.status,'active')));
 if(admins.length)await db.insert(notifications).values(admins.map(admin=>({id:`N-${crypto.randomUUID()}`,accountId:admin.id,type:'vip_request',title:'درخواست خرید مشتری VIP',body:title,link:'/admin/requests',createdAt:now})));
 await writeAudit(db,account,'vip.request_created','property_request',id,'درخواست خرید کلاب VIP ثبت شد.',{});
 return Response.json({ok:true,id,message:'مشخصات شما ثبت شد. کارشناسان حاتم برای پیگیری درخواست با شما تماس می‌گیرند.'},{status:201});
}
