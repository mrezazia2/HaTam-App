import Link from "next/link";
import {
  BarChartIcon,
  CalendarIcon,
  ChatBubbleIcon,
  DashboardIcon,
  HomeIcon,
  PersonIcon,
  PlusIcon,
} from "@radix-ui/react-icons";

type PanelKind = "consultant" | "agency";

export default function PanelShell({ kind }: { kind: PanelKind }) {
  const agency = kind === "agency";
  return (
    <main className="panel-shell" dir="rtl">
      <aside className="panel-sidebar">
        <Link href="/"><img src="/assets/hatam/hatam-logo-transparent-gold.png" alt="حاتم" /></Link>
        <span className="panel-type">{agency ? "پنل آژانس املاک" : "پنل مشاور املاک"}</span>
        <nav>
          <button className="active"><DashboardIcon /> داشبورد</button>
          <button><HomeIcon /> فایل‌های ملکی</button>
          <button><PersonIcon /> {agency ? "مشاوران" : "مشتریان"}</button>
          <button><CalendarIcon /> بازدیدها</button>
          <button><ChatBubbleIcon /> پیام‌ها</button>
          <button><BarChartIcon /> گزارش‌ها</button>
        </nav>
        <Link className="back-site" href="/">بازگشت به سایت</Link>
      </aside>
      <section className="panel-content">
        <header>
          <div><span>جمعه، ۱۶ مرداد ۱۴۰۵</span><h1>{agency ? "مدیریت آژانس حاتم" : "سلام، حاتم امیری"}</h1></div>
          <button><PlusIcon /> {agency ? "افزودن مشاور" : "ثبت فایل جدید"}</button>
        </header>
        <div className="stat-grid">
          <article><span>فایل‌های فعال</span><strong>{agency ? "۱۲۸" : "۲۴"}</strong><small>۸ فایل جدید این ماه</small></article>
          <article><span>درخواست‌های بازدید</span><strong>{agency ? "۴۶" : "۹"}</strong><small>۳ مورد برای امروز</small></article>
          <article><span>{agency ? "مشاوران فعال" : "مشتریان فعال"}</span><strong>{agency ? "۱۸" : "۳۱"}</strong><small>روند ماهانه مثبت</small></article>
          <article><span>قراردادهای این ماه</span><strong>{agency ? "۲۱" : "۴"}</strong><small>۱۲٪ رشد نسبت به ماه قبل</small></article>
        </div>
        <div className="panel-grid">
          <article className="panel-card wide">
            <div className="panel-card-title"><div><h2>عملکرد ماهانه</h2><span>نمای کلی درخواست‌ها و قراردادها</span></div><button>۳۰ روز اخیر</button></div>
            <div className="chart-bars" aria-label="نمودار عملکرد ماهانه">
              {[42,68,54,82,64,90,73,96,78,100,85,92].map((h, index) => <i key={index} style={{height:`${h}%`}} />)}
            </div>
          </article>
          <article className="panel-card">
            <div className="panel-card-title"><div><h2>بازدیدهای امروز</h2><span>برنامه زمان‌بندی‌شده</span></div></div>
            <div className="visit-list">
              <div><b>۱۰:۳۰</b><span>آپارتمان نیاوران<small>با سارا محمدی</small></span></div>
              <div><b>۱۴:۰۰</b><span>پنت‌هاوس فرمانیه<small>با امیر رضایی</small></span></div>
              <div><b>۱۷:۱۵</b><span>واحد زعفرانیه<small>با نیما اکبری</small></span></div>
            </div>
          </article>
          <article className="panel-card wide files-card">
            <div className="panel-card-title"><div><h2>آخرین فایل‌ها</h2><span>فایل‌های تازه ثبت‌شده در سامانه</span></div><button>مشاهده همه</button></div>
            <div className="panel-file-list">
              <div><img src="/assets/hatam/penthouse.webp" alt="" /><span><strong>پنت‌هاوس ۲۱۰ متری</strong><small>فرمانیه · ۳۲ میلیارد</small></span><em>تایید شده</em></div>
              <div><img src="/assets/hatam/bright-apartment.webp" alt="" /><span><strong>آپارتمان ۱۴۰ متری</strong><small>زعفرانیه · ۱۸.۸ میلیارد</small></span><em>در انتظار بررسی</em></div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
