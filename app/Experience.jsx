"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityLogIcon,
  BackpackIcon,
  BarChartIcon,
  BellIcon,
  BookmarkIcon,
  CalendarIcon,
  CardStackIcon,
  ChatBubbleIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Crosshair2Icon,
  DashboardIcon,
  DrawingPinIcon,
  ExitIcon,
  FileTextIcon,
  GearIcon,
  HeartFilledIcon,
  HeartIcon,
  HomeIcon,
  IdCardIcon,
  MagicWandIcon,
  MagnifyingGlassIcon,
  PersonIcon,
  PlusIcon,
  RocketIcon,
} from "@radix-ui/react-icons";
import { BrandLogo, useBrandSettings } from "./BrandTheme";

const properties = [
  { id: 1, badge: "ویژه", image: "/assets/hatam/luxury-living.webp", title: "آپارتمان لوکس نیاوران", meta: "۱۰۰ متر / ۲ خواب", area: "نیاوران، کامرانیه", price: "۹,۳۰۰ میلیارد تومان" },
  { id: 2, badge: "فوری", image: "/assets/hatam/bright-apartment.webp", title: "آپارتمان نوساز سعادت‌آباد", meta: "۱۱۰ متر / ۳ خواب", area: "سعادت‌آباد، علامه شمالی", price: "۱۱,۸۰۰ میلیارد تومان" },
  { id: 3, badge: "VIP", image: "/assets/hatam/penthouse.webp", title: "پنت‌هاوس فرمانیه", meta: "۹۰ متر / ۲ خواب", area: "فرمانیه، اندرزگو", price: "۸,۴۰۰ میلیارد تومان" },
  { id: 4, badge: "VIP", image: "/assets/hatam/luxury-living.webp", title: "رزیدنس الهیه", meta: "۱۲۵ متر / ۳ خواب", area: "الهیه، فرشته", price: "۱۲,۵۰۰ میلیارد تومان" },
];

const quickActions = [
  { Icon: PersonIcon, title: "مشاور اختصاصی", text: "از ابتدا تا انجام معامله همراه شما" },
  { Icon: CalendarIcon, title: "درخواست بازدید", text: "انتخاب زمان دلخواه" },
  { Icon: BackpackIcon, title: "ارزش واقعی ملک", text: "تخمین قیمت با هوش مصنوعی" },
  { Icon: Crosshair2Icon, title: "بازدید سه‌بعدی", text: "تور ۳۶۰ درجه" },
];

function go(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function Brand() {
  return <button className="brand" onClick={() => go("/")} aria-label="خانه املاک حاتم"><BrandLogo compact /></button>;
}

function PropertyCard({ property, favorite, onFavorite, onOpen }) {
  return (
    <article className="listing-card">
      <button className="listing-open" onClick={onOpen} aria-label={`مشاهده ${property.title}`} />
      <div className="listing-image">
        <img src={property.image} alt={property.title} />
        <span>{property.badge}</span>
      </div>
      <div className="listing-body">
        <div className="listing-title-row"><h3>{property.title}</h3><button className="heart" onClick={(e) => { e.stopPropagation(); onFavorite(); }} aria-label="علاقه‌مندی">{favorite ? <HeartFilledIcon /> : <HeartIcon />}</button></div>
        <p>{property.meta}</p>
        <small><DrawingPinIcon /> {property.area}</small>
        <strong>{property.price}</strong>
      </div>
    </article>
  );
}

function Header({ onPanel }) {
  return (
    <header className="site-header" dir="rtl">
      <div className="header-inner">
        <div className="account-box">
          <img src="/assets/hatam/advisor.webp" alt="حاتم امیری" />
          <button onClick={onPanel}><strong>سلام، حاتم</strong><span>مشاهده پنل</span></button>
        </div>
        <div className="header-actions"><button aria-label="اعلان‌ها"><BellIcon /></button><button aria-label="علاقه‌مندی‌ها"><HeartIcon /></button></div>
        <nav aria-label="منوی اصلی">
          <button className="active" onClick={() => go("/")}>خانه</button>
          <button onClick={() => document.querySelector(".smart-search")?.scrollIntoView({ behavior: "smooth" })}>جست‌وجو</button>
          <button onClick={() => document.querySelector(".featured")?.scrollIntoView({ behavior: "smooth" })}>فایل‌ها</button>
          <button onClick={onPanel}>مشاوران</button>
          <button>وبلاگ</button>
        </nav>
        <Brand />
      </div>
    </header>
  );
}

function DetailModal({ property, onClose }) {
  if (!property) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="property-modal" dir="rtl" role="dialog" aria-modal="true" aria-label={property.title} onMouseDown={(e) => e.stopPropagation()}>
    <button className="modal-close" onClick={onClose} aria-label="بستن">×</button>
    <img src={property.image} alt={property.title} />
    <div><span className="gold-tag">{property.badge}</span><h2>{property.title}</h2><p><DrawingPinIcon /> {property.area}</p><div className="modal-metrics"><span>متراژ<strong>{property.meta.split("/")[0]}</strong></span><span>اتاق خواب<strong>{property.meta.split("/")[1]}</strong></span><span>قیمت کل<strong>{property.price}</strong></span></div><button className="primary-button"><CalendarIcon /> درخواست بازدید</button></div>
  </section></div>;
}

function HomePage() {
  const brandSettings = useBrandSettings();
  const [favorites, setFavorites] = useState([1]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");
  const filtered = useMemo(() => properties.filter((p) => `${p.title} ${p.area}`.includes(query.trim())), [query]);
  const toggleFavorite = (id) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const runSearch = () => { document.querySelector(".featured")?.scrollIntoView({ behavior: "smooth" }); setToast(query ? `نتایج مرتبط با «${query}» نمایش داده شد` : "فایل‌های پیشنهادی نمایش داده شد"); window.setTimeout(() => setToast(""), 2600); };

  return <main className="home-page" dir="rtl">
    <section className="hero-shell">
      <Header onPanel={() => go("/panel")} />
      <div className="hero-content">
        <h1>{brandSettings.slogan.split("،")[0]} <em>{brandSettings.slogan.split("،").slice(1).join("،").trim()}</em></h1>
        <p>خرید، فروش و سرمایه‌گذاری مطمئن در املاک تهران</p>
        <div className="smart-search">
          <button className="search-submit" onClick={runSearch}><MagicWandIcon /> جست‌وجوی هوشمند</button>
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} placeholder="خانه مورد نظرت رو با هوش مصنوعی پیدا کن..." aria-label="جست‌وجوی هوشمند ملک" />
          <MagnifyingGlassIcon />
        </div>
        <div className="filter-row">
          {["منطقه", "محله", "نوع ملک", "قیمت", "متراژ"].map((item) => <button key={item}>{item}<ChevronDownIcon /></button>)}
          <button className="more-filter">فیلتر بیشتر <PlusIcon /></button>
        </div>
        <div className="quick-action-grid">
          {quickActions.map(({ Icon, title, text }) => <button key={title} onClick={() => setToast(`${title} انتخاب شد`)}><Icon /><span><strong>{title}</strong><small>{text}</small></span></button>)}
        </div>
      </div>
    </section>

    <section className="featured page-section">
      <div className="section-title"><div><span>انتخاب‌های مطمئن حاتم</span><h2>فایل‌های ویژه</h2></div><button>مشاهده همه <ChevronLeftIcon /></button></div>
      <div className="listing-grid">
        {(query ? filtered : properties).map((property) => <PropertyCard key={property.id} property={property} favorite={favorites.includes(property.id)} onFavorite={() => toggleFavorite(property.id)} onOpen={() => setSelected(property)} />)}
      </div>
      {query && filtered.length === 0 && <div className="no-result"><MagnifyingGlassIcon /><h3>فایلی با این عبارت پیدا نشد</h3><button onClick={() => setQuery("")}>نمایش همه فایل‌ها</button></div>}
    </section>

    <section className="trust-strip page-section"><div><strong>+۲۴۰</strong><span>فایل تاییدشده</span></div><div><strong>۹۸٪</strong><span>رضایت مشتریان</span></div><div><strong>۱۵ سال</strong><span>تجربه بازار تهران</span></div><button onClick={() => go("/panel")}><RocketIcon /> ورود به پنل کاربری</button></section>
    {toast && <div className="toast" role="status">{toast}</div>}
    <DetailModal property={selected} onClose={() => setSelected(null)} />
  </main>;
}

function MarketChart({ compact = false }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * ratio; canvas.height = height * ratio; context.scale(ratio, ratio);
    const values = compact ? [28, 36, 34, 48, 55, 62, 58, 72, 81, 88] : [52, 59, 66, 74, 81, 76, 86, 96, 91, 104, 111, 116];
    const pad = 18; const step = (width - pad * 2) / (values.length - 1); const min = Math.min(...values) - 6; const max = Math.max(...values) + 5;
    context.clearRect(0, 0, width, height);
    context.strokeStyle = "rgba(206,165,87,.13)"; context.lineWidth = 1;
    for (let i = 1; i < 5; i++) { const y = (height / 5) * i; context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
    const points = values.map((value, index) => [pad + step * index, height - pad - ((value - min) / (max - min)) * (height - pad * 2)]);
    context.beginPath(); points.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y)); context.strokeStyle = "#d8b766"; context.lineWidth = 2; context.stroke();
    points.forEach(([x, y]) => { context.beginPath(); context.arc(x, y, 3, 0, Math.PI * 2); context.fillStyle = "#edd585"; context.fill(); context.strokeStyle = "#183e31"; context.lineWidth = 2; context.stroke(); });
  }, [compact]);
  return <canvas className="market-chart" ref={canvasRef} aria-label="نمودار تغییرات قیمت مسکن" />;
}

const menu = [
  [DashboardIcon, "داشبورد"], [FileTextIcon, "فایل‌ها"], [PersonIcon, "مشتریان"], [CardStackIcon, "قراردادها"], [CalendarIcon, "بازدیدها"], [BarChartIcon, "مالی"], [IdCardIcon, "تیم من"], [GearIcon, "تنظیمات"],
];

function PanelPage() {
  const [active, setActive] = useState("داشبورد");
  const [assistantOpen, setAssistantOpen] = useState(true);
  return <main className="panel-page" dir="rtl">
    <aside className="panel-sidebar">
      <Brand />
      <nav>{menu.map(([Icon, label]) => <button key={label} className={active === label ? "active" : ""} onClick={() => setActive(label)}><Icon />{label}</button>)}</nav>
      <button className="logout" onClick={() => go("/")}><ExitIcon /> خروج</button>
    </aside>
    <section className="panel-content">
      <header className="panel-topbar"><div><h1>پنل کاربری</h1><p>سلام حاتم، اینجا خلاصه فعالیت‌های امروز شماست.</p></div><div className="panel-user"><button aria-label="اعلان‌ها"><BellIcon /></button><img src="/assets/hatam/advisor.webp" alt="حاتم امیری" /><span><strong>حاتم امیری</strong><small>کاربر ویژه</small></span></div></header>

      {active === "داشبورد" ? <>
        <div className="stat-grid"><article><span>فایل‌های فعال</span><strong>۲۸</strong><small>+۴ این ماه</small></article><article><span>قراردادها</span><strong>۲۸</strong><small>۳ قرارداد جدید</small></article><article><span>مشاوران</span><strong>۳۶۷</strong><small>۱۲ نفر آنلاین</small></article><article><span>درآمد این ماه</span><strong>۸۶۵ م</strong><small>+۱۲.۵٪ رشد</small></article></div>
        <div className="dashboard-grid">
          <article className="recent-card panel-card"><div className="card-heading"><h2>فایل‌های اخیر</h2><button>مشاهده همه</button></div><div className="recent-inner"><PropertyCard property={properties[2]} favorite onFavorite={() => {}} onOpen={() => {}} /><div className="chart-wrap"><div className="chart-head"><span>نمودار ماه</span><button>این ماه <ChevronDownIcon /></button></div><MarketChart compact /></div></div></article>
          <article className="activities-card panel-card"><div className="card-heading"><h2>آخرین فعالیت‌ها</h2><button>مشاهده همه</button></div><ul><li><CalendarIcon /><span><strong>درخواست بازدید</strong><small>آپارتمان ۱۲۵ متری نیاوران</small></span><time>۲ ساعت پیش</time></li><li><ChatBubbleIcon /><span><strong>پیام از مشاور</strong><small>درباره آپارتمان سعادت‌آباد</small></span><time>۵ ساعت پیش</time></li><li><BookmarkIcon /><span><strong>فایل ذخیره‌شده</strong><small>آپارتمان ۹۰ متری پیروزی</small></span><time>دیروز</time></li></ul></article>
          <article className="ai-card panel-card"><div className="ai-orbit"><span>AI</span></div><h2>دستیار هوشمند حاتم</h2>{assistantOpen ? <><p>سلام، چطور می‌تونم کمکت کنم؟</p><div className="chat-bubble">خانه ۹۰ متری در پیروزی نزدیک مترو زیر ۸ میلیارد می‌خوام</div><div className="typing"><span /><span /><span /> در حال جست‌وجو...</div><div className="chat-result">۳ فایل مناسب پیدا شد</div><button onClick={() => go("/")}>مشاهده فایل‌ها</button></> : <button onClick={() => setAssistantOpen(true)}>باز کردن دستیار</button>}</article>
          <article className="market-card panel-card"><div className="card-heading"><h2>وضعیت بازار تهران</h2><span>به‌روزرسانی امروز</span></div><div className="market-tabs"><button className="active">قیمت هر متر</button><button>تعداد معاملات</button></div><div className="market-summary"><div><span>میانگین قیمت هر متر تهران</span><strong>۸۸,۵۰۰,۰۰۰</strong></div><div className="positive"><span>نسبت به ماه گذشته</span><strong>+۱۲.۵٪</strong></div></div><MarketChart /><div className="months"><span>فروردین</span><span>اردیبهشت</span><span>خرداد</span><span>تیر</span><span>مرداد</span><span>شهریور</span></div></article>
        </div>
      </> : <section className="empty-panel panel-card"><ActivityLogIcon /><h2>{active}</h2><p>این بخش در نسخه بعدی به داشبورد متصل می‌شود.</p><button onClick={() => setActive("داشبورد")}>بازگشت به داشبورد</button></section>}
    </section>
  </main>;
}

export function App() {
  const [path, setPath] = useState(() => typeof window === "undefined" ? "/" : window.location.pathname);
  useEffect(() => { const handler = () => setPath(window.location.pathname); window.addEventListener("popstate", handler); return () => window.removeEventListener("popstate", handler); }, []);
  return path.startsWith("/panel") ? <PanelPage /> : <HomePage />;
}

export function HomeExperience() {
  return <div className="experience-root"><HomePage /></div>;
}

export function PanelExperience() {
  return <div className="experience-root"><PanelPage /></div>;
}
