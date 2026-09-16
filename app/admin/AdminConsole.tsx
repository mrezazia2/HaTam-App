"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChartIcon, CalendarIcon, CardStackIcon, CheckCircledIcon, ChevronDownIcon,
  DashboardIcon, FileTextIcon, GearIcon, IdCardIcon, MagnifyingGlassIcon,
  PersonIcon, PlusIcon, ReaderIcon, RocketIcon,
} from "@radix-ui/react-icons";
import { useBrand } from "../brand/BrandProvider";

type ModuleKey = "dashboard" | "properties" | "users" | "consultants" | "agencies" | "consultations" | "subscriptions" | "payments";
type Status = "فعال" | "در انتظار" | "تعلیق" | "تکمیل‌شده" | "لغوشده" | "تأییدشده" | "ردشده";
type Row = { id:string; title:string; subtitle:string; meta:string; status:Status; image?:string; amount?:string };

const menu: {key:ModuleKey;label:string;Icon:typeof DashboardIcon}[] = [
  {key:"dashboard",label:"داشبورد",Icon:DashboardIcon},{key:"properties",label:"مدیریت ملک‌ها",Icon:FileTextIcon},
  {key:"users",label:"کاربران",Icon:PersonIcon},{key:"consultants",label:"مشاوران املاک",Icon:IdCardIcon},
  {key:"agencies",label:"آژانس‌های املاک",Icon:CardStackIcon},{key:"consultations",label:"مشاوره‌ها",Icon:CalendarIcon},
  {key:"subscriptions",label:"اشتراک‌ها",Icon:RocketIcon},{key:"payments",label:"پرداخت‌ها",Icon:ReaderIcon},
];

const initialRows: Record<Exclude<ModuleKey,"dashboard"|"subscriptions">,Row[]> = {
  properties:[
    {id:"HT-1042",title:"آپارتمان نوساز نیاوران",subtitle:"نیاوران، خیابان پاسداران",meta:"۱۲۵ متر · فروش",status:"فعال",image:"/assets/hatam/luxury-living.webp",amount:"۱۲.۵ میلیارد"},
    {id:"HT-1038",title:"پنت‌هاوس فرمانیه",subtitle:"فرمانیه، اندرزگو",meta:"۲۱۰ متر · فروش",status:"در انتظار",image:"/assets/hatam/penthouse.webp",amount:"۳۲ میلیارد"},
    {id:"HT-1024",title:"آپارتمان سعادت‌آباد",subtitle:"سعادت‌آباد، علامه",meta:"۱۴۰ متر · اجاره",status:"فعال",image:"/assets/hatam/bright-apartment.webp",amount:"رهن ۲ میلیارد"},
  ],
  users:[
    {id:"U-2824",title:"آرمان شریفی",subtitle:"۰۹۱۹•••۵۸۳۲",meta:"ثبت‌نام جدید · موبایل تأییدشده",status:"در انتظار"},
    {id:"U-2819",title:"مریم احمدی",subtitle:"۰۹۱۲•••۱۲۳۴",meta:"اشتراک ویژه · ۱۲ فایل ذخیره",status:"فعال"},
    {id:"U-2818",title:"علی رضایی",subtitle:"۰۹۳۵•••۸۴۲۱",meta:"کاربر عادی · ۳ درخواست",status:"فعال"},
    {id:"U-2812",title:"سارا محمدی",subtitle:"۰۹۹۱•••۴۷۱۰",meta:"اشتراک ویژه · تمدید نشده",status:"تعلیق"},
  ],
  consultants:[
    {id:"C-143",title:"حاتم امیری",subtitle:"دفتر املاک حاتم",meta:"۳۶ فایل · امتیاز ۴.۹",status:"فعال",image:"/assets/hatam/advisor.webp"},
    {id:"C-138",title:"رضا توکلی",subtitle:"منطقه ۱ و ۳ تهران",meta:"۲۴ فایل · امتیاز ۴.۷",status:"فعال"},
    {id:"C-131",title:"نگار کریمی",subtitle:"کارشناس اجاره",meta:"مدارک در حال بررسی",status:"در انتظار"},
  ],
  agencies:[
    {id:"A-48",title:"آژانس املاک حاتم",subtitle:"نیاوران، تهران",meta:"۱۲ مشاور · ۸۸ فایل",status:"فعال"},
    {id:"A-44",title:"خانه شمال تهران",subtitle:"زعفرانیه، تهران",meta:"۸ مشاور · ۴۱ فایل",status:"فعال"},
    {id:"A-39",title:"گروه ملکی پارسه",subtitle:"سعادت‌آباد، تهران",meta:"در انتظار تأیید مجوز",status:"در انتظار"},
  ],
  consultations:[
    {id:"Q-902",title:"مشاوره خرید آپارتمان",subtitle:"مریم احمدی ← حاتم امیری",meta:"امروز، ساعت ۱۷:۳۰",status:"در انتظار"},
    {id:"Q-898",title:"بررسی ارزش واقعی ملک",subtitle:"علی رضایی ← رضا توکلی",meta:"امروز، ساعت ۱۴:۰۰",status:"تکمیل‌شده"},
    {id:"Q-891",title:"مشاوره سرمایه‌گذاری",subtitle:"سارا محمدی ← تخصیص‌نیافته",meta:"فردا، ساعت ۱۰:۳۰",status:"فعال"},
  ],
  payments:[
    {id:"P-58219",title:"خرید اشتراک ویژه سالانه",subtitle:"مریم احمدی",meta:"امروز، ۱۰:۴۵ · درگاه آنلاین",status:"تکمیل‌شده",amount:"۴,۸۰۰,۰۰۰ تومان"},
    {id:"P-58214",title:"تمدید پنل مشاور حرفه‌ای",subtitle:"حاتم امیری",meta:"دیروز، ۱۸:۲۰ · کارت بانکی",status:"تکمیل‌شده",amount:"۹,۶۰۰,۰۰۰ تومان"},
    {id:"P-58208",title:"اشتراک آژانس پایه",subtitle:"گروه ملکی پارسه",meta:"دیروز، ۱۲:۱۰ · ناموفق",status:"لغوشده",amount:"۱۲,۰۰۰,۰۰۰ تومان"},
  ],
};

const moduleMeta:Record<ModuleKey,{title:string;description:string;action?:string}> = {
  dashboard:{title:"داشبورد مدیریت",description:"نمای کلی فعالیت‌های امروز اکوسیستم املاک حاتم"},
  properties:{title:"مدیریت ملک‌ها",description:"بررسی، تأیید و مدیریت فایل‌های ملکی",action:"ثبت ملک جدید"},
  users:{title:"مدیریت کاربران",description:"کاربران عادی و اعضای ویژه",action:"افزودن کاربر"},
  consultants:{title:"مشاوران املاک",description:"احراز، ارزیابی و مدیریت مشاوران",action:"دعوت مشاور"},
  agencies:{title:"آژانس‌های املاک",description:"دفاتر، مجوزها و اعضای سازمانی",action:"ثبت آژانس"},
  consultations:{title:"مدیریت مشاوره‌ها",description:"درخواست‌ها، زمان‌بندی و تخصیص مشاور",action:"مشاوره جدید"},
  subscriptions:{title:"اشتراک‌ها و پلن‌های ویژه",description:"مزایا، قیمت‌گذاری و اعضای فعال",action:"ساخت پلن"},
  payments:{title:"پرداخت‌ها",description:"تراکنش‌های کاربران، مشاوران و آژانس‌ها"},
};

export default function AdminConsole(){
  const {settings}=useBrand(); const [active,setActive]=useState<ModuleKey>("dashboard"); const [query,setQuery]=useState(""); const [notice,setNotice]=useState(""); const [dialog,setDialog]=useState(false); const [rows,setRows]=useState(initialRows);
  const meta=moduleMeta[active];
  const filtered=useMemo(()=>{
    if(active==="dashboard"||active==="subscriptions") return [];
    return rows[active].filter(r=>`${r.title} ${r.subtitle} ${r.id}`.includes(query.trim()));
  },[active,query,rows]);
  const notify=(text:string)=>{setNotice(text);window.setTimeout(()=>setNotice(""),2200)};
  const decide=(id:string,status:"تأییدشده"|"ردشده")=>{if(active==="dashboard"||active==="subscriptions")return;setRows(current=>({...current,[active]:current[active].map(row=>row.id===id?{...row,status}:row)}));notify(status==="تأییدشده"?"هویت و دسترسی با موفقیت تأیید شد.":"درخواست رد شد و دسترسی فعال نخواهد شد.")};
  return <main className="ops-page" dir="rtl">
    <aside className="ops-sidebar"><img src={settings.logoUrl} alt={settings.brandName}/><div className="ops-admin"><span>HA</span><div><strong>مدیر اصلی</strong><small>دسترسی کامل</small></div></div><nav>{menu.map(({key,label,Icon})=><button key={key} className={active===key?"active":""} onClick={()=>{setActive(key);setQuery("")}}><Icon/>{label}</button>)}</nav><Link href="/admin/brand"><GearIcon/>هویت و ظاهر</Link><Link className="ops-back" href="/">بازگشت به سایت</Link></aside>
    <section className="ops-content">
      <header className="ops-header"><div><span>پنل ادمین حاتم</span><h1>{meta.title}</h1><p>{meta.description}</p></div><div className="ops-header-actions"><button aria-label="اعلان‌های مدیر" className="ops-alert">۳</button>{meta.action&&<button className="ops-primary" onClick={()=>setDialog(true)}><PlusIcon/>{meta.action}</button>}</div></header>
      {active==="dashboard"?<Dashboard onNavigate={setActive}/>:active==="subscriptions"?<Subscriptions notify={notify}/>:<DataModule active={active} rows={filtered} query={query} setQuery={setQuery} notify={notify} decide={decide}/>} 
    </section>
    {dialog&&<QuickDialog title={meta.action||"ثبت مورد جدید"} onClose={()=>setDialog(false)} onSave={()=>{setDialog(false);notify("اطلاعات نمونه با موفقیت ثبت شد.")}}/>}{notice&&<div className="ops-toast" role="status">{notice}</div>}
  </main>
}

function Dashboard({onNavigate}:{onNavigate:(key:ModuleKey)=>void}){return <div className="ops-dashboard"><div className="ops-stats">{[["فایل‌های فعال","۲۴۸","+۱۸ این ماه"],["کاربران ویژه","۱,۲۸۴","+۶.۴٪ رشد"],["مشاوران تأییدشده","۳۶۷","۲۳ نفر آنلاین"],["درآمد ماه","۸۶۵ م","+۱۲.۵٪ رشد"]].map(([l,v,s])=><article key={l}><span>{l}</span><strong>{v}</strong><small>{s}</small></article>)}</div><div className="ops-dashboard-grid"><article className="ops-card ops-overview"><div className="ops-card-head"><div><h2>عملکرد پلتفرم</h2><p>رشد شش‌ماهه کاربران و فایل‌ها</p></div><button>۶ ماه اخیر <ChevronDownIcon/></button></div><div className="ops-chart"><i style={{height:"32%"}}/><i style={{height:"45%"}}/><i style={{height:"41%"}}/><i style={{height:"58%"}}/><i style={{height:"72%"}}/><i style={{height:"87%"}}/></div><div className="ops-chart-labels"><span>فروردین</span><span>اردیبهشت</span><span>خرداد</span><span>تیر</span><span>مرداد</span><span>شهریور</span></div></article><article className="ops-card ops-queue"><div className="ops-card-head"><div><h2>صف بررسی امروز</h2><p>موارد نیازمند اقدام مدیر</p></div></div>{[["۱۲ فایل ملک","properties"],["۵ مشاور جدید","consultants"],["۳ آژانس جدید","agencies"],["۸ مشاوره بدون تخصیص","consultations"]].map(([label,key])=><button key={key} onClick={()=>onNavigate(key as ModuleKey)}><span>{label}</span><b>بررسی</b></button>)}</article><article className="ops-card ops-activity"><div className="ops-card-head"><div><h2>فعالیت‌های زنده</h2><p>آخرین رویدادهای سامانه</p></div></div><ul><li><CheckCircledIcon/><span><b>اشتراک ویژه فعال شد</b><small>مریم احمدی · ۳ دقیقه پیش</small></span></li><li><FileTextIcon/><span><b>فایل ملکی تازه ثبت شد</b><small>نیاوران · ۱۲ دقیقه پیش</small></span></li><li><IdCardIcon/><span><b>مدارک مشاور تکمیل شد</b><small>نگار کریمی · ۲۵ دقیقه پیش</small></span></li></ul></article></div></div>}

function DataModule({active,rows,query,setQuery,notify,decide}:{active:ModuleKey;rows:Row[];query:string;setQuery:(v:string)=>void;notify:(v:string)=>void;decide:(id:string,status:"تأییدشده"|"ردشده")=>void}){const approvable=["users","consultants","agencies"].includes(active);return <section className="ops-module"><div className="ops-toolbar"><label><MagnifyingGlassIcon/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جست‌وجو با نام، شناسه یا شماره..."/></label><div><button>همه وضعیت‌ها <ChevronDownIcon/></button><button>خروجی گزارش</button></div></div><div className="ops-table"><div className="ops-table-head"><span>عنوان و شناسه</span><span>جزئیات</span><span>{active==="payments"?"مبلغ":"اطلاعات"}</span><span>وضعیت</span><span>عملیات</span></div>{rows.map(row=><article key={row.id}><div className="ops-identity">{row.image?<img src={row.image} alt=""/>:<span className="ops-avatar">{row.title.slice(0,1)}</span>}<div><strong>{row.title}</strong><small>{row.id}</small></div></div><span>{row.subtitle}</span><span>{row.amount||row.meta}</span><em className={`status-${row.status}`}>{row.status}</em><div className="ops-row-actions">{approvable&&row.status==="در انتظار"?<><button className="approve" onClick={()=>decide(row.id,"تأییدشده")}>تأیید</button><button className="reject" onClick={()=>decide(row.id,"ردشده")}>رد</button></>:<><button onClick={()=>notify(`جزئیات «${row.title}» باز شد.`)}>مشاهده</button><button onClick={()=>notify("منوی مدیریت حساب باز شد.")}>•••</button></>}</div></article>)}{rows.length===0&&<div className="ops-empty">نتیجه‌ای برای این جست‌وجو پیدا نشد.</div>}</div></section>}

function Subscriptions({notify}:{notify:(v:string)=>void}){const plans=[{name:"کاربر ویژه",price:"۴۰۰ هزار",tone:"gold",features:["فایل‌های اختصاصی","هشدار فوری قیمت","دستیار هوشمند کامل","مشاوره اولویت‌دار"],members:"۱,۲۸۴ عضو"},{name:"مشاور حرفه‌ای",price:"۸۰۰ هزار",tone:"green",features:["ثبت نامحدود فایل","مدیریت مشتریان","گزارش عملکرد","نشان مشاور تأییدشده"],members:"۲۶۸ عضو"},{name:"آژانس سازمانی",price:"۱.۵ میلیون",tone:"dark",features:["تا ۱۵ مشاور","مدیریت تیم و فایل‌ها","گزارش مالی","صفحه اختصاصی آژانس"],members:"۴۸ آژانس"}];return <section className="subscription-module"><div className="plan-summary"><article><RocketIcon/><div><strong>۱,۶۰۰</strong><span>اشتراک فعال</span></div></article><article><BarChartIcon/><div><strong>۸۲٪</strong><span>نرخ تمدید</span></div></article><article><CardStackIcon/><div><strong>۵۷۶ م</strong><span>درآمد تکرارشونده</span></div></article></div><div className="plan-grid">{plans.map(p=><article className={`plan-card ${p.tone}`} key={p.name}><div className="plan-head"><span>{p.name}</span><small>{p.members}</small></div><div className="plan-price"><strong>{p.price}</strong><span>تومان / ماه</span></div><ul>{p.features.map(f=><li key={f}><CheckCircledIcon/>{f}</li>)}</ul><button onClick={()=>notify(`ویرایش پلن «${p.name}» فعال شد.`)}>ویرایش پلن</button></article>)}</div><article className="ops-card member-strip"><div><h2>اعضای ویژه در آستانه تمدید</h2><p>۳۷ اشتراک طی ۷ روز آینده منقضی می‌شود.</p></div><button onClick={()=>notify("یادآوری تمدید برای اعضای نمونه آماده شد.")}>ارسال یادآوری</button></article></section>}

function QuickDialog({title,onClose,onSave}:{title:string;onClose:()=>void;onSave:()=>void}){return <div className="ops-modal" role="presentation" onMouseDown={onClose}><section role="dialog" aria-modal="true" aria-label={title} onMouseDown={e=>e.stopPropagation()}><div className="ops-modal-head"><div><span>فرم سریع</span><h2>{title}</h2></div><button onClick={onClose}>×</button></div><label><span>عنوان یا نام</span><input placeholder="اطلاعات اصلی را وارد کنید"/></label><div className="ops-modal-fields"><label><span>شماره تماس</span><input placeholder="09xx xxx xxxx"/></label><label><span>وضعیت</span><select><option>فعال</option><option>در انتظار</option></select></label></div><label><span>توضیحات</span><textarea placeholder="یادداشت داخلی مدیر"/></label><div className="ops-modal-actions"><button onClick={onClose}>انصراف</button><button className="ops-primary" onClick={onSave}>ثبت اطلاعات</button></div></section></div>}
