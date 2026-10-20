import {eq} from 'drizzle-orm';
import {getDb} from '../../../db';
import {subscriptions} from '../../../db/schema';
import {activeVipSubscription} from '../../vip/validation';
export async function hasVipAccess(account:{id:string;role:string;status:string}|null){
 if(!account||account.status!=='active')return false;
 if(account.role==='admin')return true;
 if(account.role!=='user')return false;
 return (await getDb().select().from(subscriptions).where(eq(subscriptions.accountId,account.id))).some(row=>activeVipSubscription(row));
}
