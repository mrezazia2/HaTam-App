import { getDb } from "../../../db";
import { subscriptionPlans } from "../../../db/schema";

export async function ensureDefaultPlans(){
 const db=getDb(),current=await db.select().from(subscriptionPlans).limit(1);if(current.length)return;
 const now=new Date();await db.insert(subscriptionPlans).values([
  {id:"PLAN-USER",name:"حاتم ویژه",audience:"user",price:4800000,durationDays:365,features:["فایل‌های اختصاصی","هشدار فوری قیمت","دستیار هوشمند","مشاوره اولویت‌دار"],active:true,createdAt:now,updatedAt:now},
  {id:"PLAN-CONSULTANT",name:"مشاور حرفه‌ای",audience:"consultant",price:9600000,durationDays:365,features:["ثبت نامحدود فایل","مدیریت مشتریان","گزارش عملکرد","نشان تأییدشده"],active:true,createdAt:now,updatedAt:now},
  {id:"PLAN-AGENCY",name:"آژانس سازمانی",audience:"agency",price:18000000,durationDays:365,features:["مدیریت تیم و فایل‌ها","گزارش مالی","صفحه اختصاصی آژانس","پشتیبانی اولویت‌دار"],active:true,createdAt:now,updatedAt:now},
 ]);
}
