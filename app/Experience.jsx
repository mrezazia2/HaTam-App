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
  HamburgerMenuIcon,
  HomeIcon,
  IdCardIcon,
  MagicWandIcon,
  MagnifyingGlassIcon,
  PersonIcon,
  PlusIcon,
  Cross2Icon,
  RocketIcon,
} from "@radix-ui/react-icons";
import { useBrand } from "./brand/BrandProvider";
import { defaultFilterConfig, fetchFilterConfig } from "./mobile/filter-config";

const demoProperties = [
  { id: 1, badge: "ویژه", image: "/assets/hatam/luxury-living.webp", title: "آپارتمان لوکس نیاوران", meta: "۱۰۰ متر / ۲ خواب", area: "نیاوران، کامرانیه", district: "منطقه ۱", neighborhood: "نیاوران", kind: "آپارتمان", size: 100, priceValue: 9300, price: "۹,۳۰۰ میلیارد تومان" },
  { id: 2, badge: "فوری", image: "/assets/hatam/bright-apartment.webp", title: "آپارتمان نوساز سعادت‌آباد", meta: "۱۱۰ متر / ۳ خواب", area: "سعادت‌آباد، علامه شمالی", district: "منطقه ۲", neighborhood: "سعادت‌آباد", kind: "آپارتمان", size: 110, priceValue: 11800, price: "۱۱,۸۰۰ میلیارد تومان" },
  { id: 3, badge: "VIP", image: "/assets/hatam/penthouse.webp", title: "پنت‌هاوس فرمانیه", meta: "۹۰ متر / ۲ خواب", area: "فرمانیه، اندرزگو", district: "منطقه ۱", neighborhood: "فرمانیه", kind: "پنت‌هاوس", size: 90, priceValue: 8400, price: "۸,۴۰۰ میلیارد تومان" },
  { id: 4, badge: "VIP", image: "/assets/hatam/luxury-living.webp", title: "رزیدنس الهیه", meta: "۱۲۵ متر / ۳ خواب", area: "الهیه، فرشته", district: "منطقه ۱", neighborhood: "الهیه", kind: "آپارتمان", size: 125, priceValue: 12500, price: "۱۲,۵۰۰ میلیارد تومان" },
];

const quickActions = [
  { Icon: PersonIcon, title: "مشاور اختصاصی", text: "از ابتدا تا انجام معامله همراه شما" },
  { Icon: CalendarIcon, title: "درخواست بازدید", text: "انتخاب زمان دلخواه" },
  { Icon: BackpackIcon, title: "ارزش واقعی ملک", text: "تخمین قیمت با هوش مصنوعی" },
  { Icon: Crosshair2Icon, title: "بازدید سه‌بعدی", text: "تور ۳۶۰ درجه" },
];

const latinDigits = (value = "") => String(value).replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
const sameDistrict = (left, right) => latinDigits(left).replace(/\D/g, "") === latinDigits(right).replace(/\D/g, "");

function go(path) {
  window.location.assign(path);
}

function Brand() {
  const { settings } = useBrand();
  return <button className="brand" onClick={() => go("/")} aria-label={`خانه ${settings.brandName}`}><img src={settings.logoUrl} alt={settings.brandName} /></button>;
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
  const [account, setAccount] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { fetch("/api/auth/session", { cache: "no-store" }).then((response) => response.json()).then((data) => setAccount(data.account || null)).catch(() => setAccount(null)); }, []);
  return (
    <header className="site-header" dir="rtl">
      <div className="header-inner">
        {account ? <div className="account-box"><img src="/assets/hatam/advisor.webp" alt={account.name} /><button onClick={onPanel}><strong>سلام، {account.name}</strong><span>مشاهده پنل</span></button></div> : <button className="guest-login" onClick={() => go("/login")}><PersonIcon /> ورود / ثبت‌نام</button>}
        <div className="header-actions"><button aria-label="اعلان‌ها" onClick={() => go("/panel")}><BellIcon /></button><button aria-label="علاقه‌مندی‌ها" onClick={() => go("/panel")}><HeartIcon /></button></div>
        <button className="site-menu-toggle" aria-label={menuOpen ? "بستن منوی سایت" : "بازکردن منوی سایت"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <Cross2Icon /> : <HamburgerMenuIcon />}</button>
        <nav className={menuOpen ? "open" : ""} aria-label="منوی اصلی">
          <button className="active" onClick={() => go("/")}>خانه</button>
          <button onClick={() => document.querySelector(".smart-search")?.scrollIntoView({ behavior: "smooth" })}>جست‌وجو</button>
          <button onClick={() => document.querySelector(".featured")?.scrollIntoView({ behavior: "smooth" })}>فایل‌ها</button>
          <button onClick={() => go("/consultants")}>مشاوران</button>
          <button onClick={() => go("/content/blog")}>وبلاگ</button>
          {!account && <button onClick={() => go("/login")}>ورود / ثبت‌نام</button>}
        </nav>
        <Brand />
      </div>
    </header>
  );
}

function DetailModal({ property, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!property) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleKeyDown); };
  }, [property, onClose]);
  if (!property) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="property-modal" dir="rtl" role="dialog" aria-modal="true" aria-labelledby="property-modal-title" onMouseDown={(e) => e.stopPropagation()}>
    <button ref={closeRef} className="modal-close" onClick={onClose} aria-label="بستن">×</button>
    <img src={property.image} alt={property.title} />
    <div><span className="gold-tag">{property.badge}</span><h2 id="property-modal-title">{property.title}</h2><p><DrawingPinIcon /> {property.area}</p><div className="modal-metrics"><span>متراژ<strong>{property.meta.split("/")[0]}</strong></span><span>اتاق خواب<strong>{property.meta.split("/")[1]}</strong></span><span>قیمت کل<strong>{property.price}</strong></span></div><button className="primary-button" onClick={() => go(`/property/${property.id}`)}><CalendarIcon /> مشاهده جزئیات کامل</button></div>
  </section></div>;
}

function HomePage() {
  const { settings } = useBrand();
  const [properties, setProperties] = useState([]);
  const [filterConfig, setFilterConfig] = useState(defaultFilterConfig);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [account, setAccount] = useState(null);
  const [query, setQuery] = useState("");
  const [smartMatchIds, setSmartMatchIds] = useState(null);
  const [searchBusy, setSearchBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ district: "", neighborhood: "", kind: "", budget: "", size: "", minPrice: "", maxPrice: "", minSize: "", maxSize: "" });
  const setFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));
  const resetFilters = () => { setFilters({ district: "", neighborhood: "", kind: "", budget: "", size: "", minPrice: "", maxPrice: "", minSize: "", maxSize: "" }); setQuery(""); setSmartMatchIds(null); };
  const loadProperties = () => {
    setLoading(true); setLoadError("");
    fetch("/api/properties", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setProperties((data.items || []).map((property) => ({
        ...property,
        badge: property.featured ? "ویژه" : property.transactionType === "rent" ? "اجاره" : property.transactionType === "presale" ? "پیش‌فروش" : "فروش",
        image: property.coverImage || "/assets/hatam/luxury-living.webp",
        meta: `${Number(property.area).toLocaleString("fa-IR", { useGrouping: false })} متر / ${Number(property.bedrooms).toLocaleString("fa-IR", { useGrouping: false })} خواب`,
        area: property.address,
        neighborhood: property.address.split(/[،,-]/)[0]?.trim() || property.address,
        kind: property.propertyType === "penthouse" ? "پنت‌هاوس" : "آپارتمان",
        size: Number(property.area),
        priceValue: Number(property.price),
        price: `${Number(property.price).toLocaleString("fa-IR")} تومان`,
      }))))
      .catch(() => setLoadError("دریافت فایل‌های ملک انجام نشد."))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    loadProperties(); fetchFilterConfig().then(setFilterConfig);
    fetch("/api/auth/session", { cache: "no-store" }).then((response) => response.json()).then((data) => {
      setAccount(data.account || null);
      if (data.account?.role === "user") fetch("/api/favorites", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((result) => setFavorites((result.items || []).map((item) => item.property.id))).catch(() => {});
    }).catch(() => setAccount(null));
  }, []);
  const filtered = useMemo(() => properties.filter((p) => {
    const textMatches = smartMatchIds ? true : `${p.title} ${p.area}`.includes(query.trim());
    const budgetMatches = !filters.budget || (filters.budget === "under-10" ? p.priceValue < 10000000000 : p.priceValue >= 10000000000);
    const sizeMatches = !filters.size || (filters.size === "under-100" ? p.size < 100 : p.size >= 100);
    const smartMatches = !smartMatchIds || smartMatchIds.includes(String(p.id));
    return smartMatches && textMatches && (!filters.district || sameDistrict(p.district, filters.district)) && (!filters.neighborhood || p.area.includes(filters.neighborhood)) && (!filters.kind || p.kind === filters.kind) && budgetMatches && sizeMatches && (!filters.minPrice || p.priceValue >= Number(filters.minPrice)) && (!filters.maxPrice || p.priceValue <= Number(filters.maxPrice)) && (!filters.minSize || p.size >= Number(filters.minSize)) && (!filters.maxSize || p.size <= Number(filters.maxSize));
  }), [query, filters, smartMatchIds]);
  const hasFilters = Boolean(query || Object.values(filters).some(Boolean));
  const toggleFavorite = async (id) => {
    if (!account || account.role !== "user") return go(`/login/user?returnTo=${encodeURIComponent("/")}`);
    const removing = favorites.includes(id);
    setFavorites((current) => removing ? current.filter((item) => item !== id) : [...current, id]);
    const response = await fetch(removing ? `/api/favorites?propertyId=${encodeURIComponent(id)}` : "/api/favorites", removing ? { method: "DELETE" } : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ propertyId: id }) });
    if (!response.ok) { setFavorites((current) => removing ? [...current, id] : current.filter((item) => item !== id)); setToast("ذخیره علاقه‌مندی انجام نشد."); }
  };
  const runSearch = async () => {
    const message = query.trim();
    if (!message) { setSmartMatchIds(null); document.querySelector(".featured")?.scrollIntoView({ behavior: "smooth" }); return; }
    setSearchBusy(true);
    try {
      const response = await fetch("/api/ai-assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || "جست‌وجوی هوشمند انجام نشد.");
      setSmartMatchIds((result.matches || []).map((item) => String(item.id)));
      setToast(result.matches?.length ? "نزدیک‌ترین فایل‌های تأییدشده پیدا شد." : "فایل منطبق تأییدشده‌ای پیدا نشد.");
    } catch (error) {
      setSmartMatchIds(null);
      setToast(error instanceof Error ? `${error.message} نتایج متنی نمایش داده می‌شود.` : "نتایج متنی نمایش داده می‌شود.");
    } finally {
      setSearchBusy(false);
      document.querySelector(".featured")?.scrollIntoView({ behavior: "smooth" });
      window.setTimeout(() => setToast(""), 3600);
    }
  };
  const runQuickAction = (title) => {
    if (title === "مشاور اختصاصی") return go("/consultants");
    if (title === "ارزش واقعی ملک") return go("/app?screen=ai-chat");
    if (title === "بازدید سه‌بعدی") { setToast("تور سه‌بعدی پس از ثبت رسانهٔ ۳۶۰ درجه برای هر ملک فعال می‌شود."); return; }
    const property = properties[0];
    if (property) setSelected(property); else setToast("در حال حاضر فایل منتشرشده‌ای برای این خدمت وجود ندارد.");
  };

  return <main className="home-page" dir="rtl">
    <section className="hero-shell">
      <Header onPanel={() => go("/panel")} />
      <div className="hero-content">
        <p className="hero-kicker">تجربه‌ای مطمئن برای انتخاب خانه</p>
        <h1>{settings.slogan}</h1>
        <p>خرید، فروش و سرمایه‌گذاری مطمئن در املاک تهران</p>
        <div className="hero-role-access" aria-label="ورود بر اساس نوع حساب">
          <button onClick={() => go("/login/user")}><PersonIcon/><span><strong>خریدار و فروشنده</strong><small>ورود یا ثبت‌نام کاربر معمولی</small></span><ChevronLeftIcon/></button>
          <button onClick={() => go("/login/consultant")}><IdCardIcon/><span><strong>مشاور املاک</strong><small>ورود به پنل حرفه‌ای مشاور</small></span><ChevronLeftIcon/></button>
          <button onClick={() => go("/login/agency")}><HomeIcon/><span><strong>آژانس املاک</strong><small>ورود به حساب سازمانی آژانس</small></span><ChevronLeftIcon/></button>
        </div>
        <div className="smart-search">
          <button className="search-submit" disabled={searchBusy} onClick={runSearch}><MagicWandIcon /> {searchBusy ? "در حال جست‌وجو…" : "جست‌وجوی هوشمند"}</button>
          <input value={query} onChange={(e) => { setQuery(e.target.value); setSmartMatchIds(null); }} onKeyDown={(e) => e.key === "Enter" && !searchBusy && runSearch()} placeholder="خانه مورد نظرت رو با هوش مصنوعی پیدا کن..." aria-label="جست‌وجوی هوشمند ملک" />
          <MagnifyingGlassIcon />
        </div>
        <div className="filter-row" aria-label="فیلتر فایل‌های ملک">
          <label><span className="sr-only">منطقه</span><select aria-label="منطقه" value={filters.district} onChange={(e) => setFilters((current) => ({ ...current, district: e.target.value, neighborhood: "" }))}><option value="">همه مناطق</option>{filterConfig.regions.map((region) => <option key={region.id} value={region.name}>{region.name}</option>)}</select><ChevronDownIcon /></label>
          <label><span className="sr-only">محله</span><select aria-label="محله" value={filters.neighborhood} onChange={(e) => setFilter("neighborhood", e.target.value)}><option value="">همه محله‌ها</option>{filterConfig.regions.filter((region) => !filters.district || region.name === filters.district).flatMap((region) => region.neighborhoods).map((item) => <option key={item}>{item}</option>)}</select><ChevronDownIcon /></label>
          <label><span className="sr-only">نوع ملک</span><select aria-label="نوع ملک" value={filters.kind} onChange={(e) => setFilter("kind", e.target.value)}><option value="">همه ملک‌ها</option><option>آپارتمان</option><option>پنت‌هاوس</option></select><ChevronDownIcon /></label>
          <label><span className="sr-only">قیمت</span><select aria-label="قیمت" value={filters.budget} onChange={(e) => setFilter("budget", e.target.value)}><option value="">هر قیمت</option><option value="under-10">کمتر از ۱۰ میلیارد</option><option value="over-10">۱۰ میلیارد و بیشتر</option></select><ChevronDownIcon /></label>
          <label><span className="sr-only">متراژ</span><select aria-label="متراژ" value={filters.size} onChange={(e) => setFilter("size", e.target.value)}><option value="">هر متراژ</option><option value="under-100">کمتر از ۱۰۰ متر</option><option value="over-100">۱۰۰ متر و بیشتر</option></select><ChevronDownIcon /></label>
          <button className="more-filter" aria-expanded={moreFiltersOpen} onClick={() => setMoreFiltersOpen((open) => !open)}>فیلتر بیشتر <PlusIcon /></button>
        </div>
        {moreFiltersOpen && <div className="advanced-filter" role="group" aria-label="فیلترهای بیشتر"><label>قیمت از<input inputMode="numeric" value={filters.minPrice} onChange={(e) => setFilter("minPrice", e.target.value.replace(/\D/g, ""))} placeholder="تومان" /></label><label>قیمت تا<input inputMode="numeric" value={filters.maxPrice} onChange={(e) => setFilter("maxPrice", e.target.value.replace(/\D/g, ""))} placeholder="تومان" /></label><label>متراژ از<input inputMode="numeric" value={filters.minSize} onChange={(e) => setFilter("minSize", e.target.value.replace(/\D/g, ""))} placeholder="متر" /></label><label>متراژ تا<input inputMode="numeric" value={filters.maxSize} onChange={(e) => setFilter("maxSize", e.target.value.replace(/\D/g, ""))} placeholder="متر" /></label><button onClick={resetFilters}>پاک کردن فیلترها</button></div>}
        <div className="quick-action-grid">
          {quickActions.map(({ Icon, title, text }) => <button key={title} onClick={() => runQuickAction(title)}><Icon /><span><strong>{title}</strong><small>{text}</small></span></button>)}
        </div>
      </div>
    </section>

    <section className="featured page-section">
      <div className="section-title"><div><span>انتخاب‌های مطمئن حاتم</span><h2>فایل‌های ویژه</h2></div><button onClick={resetFilters}>مشاهده همه <ChevronLeftIcon /></button></div>
      <div className="listing-grid">
        {(hasFilters ? filtered : properties).map((property) => <PropertyCard key={property.id} property={property} favorite={favorites.includes(property.id)} onFavorite={() => toggleFavorite(property.id)} onOpen={() => setSelected(property)} />)}
      </div>
      {loading && <div className="no-result" role="status"><h3>در حال دریافت فایل‌های تأییدشده…</h3></div>}
      {!loading && loadError && <div className="no-result" role="alert"><h3>{loadError}</h3><button onClick={loadProperties}>تلاش دوباره</button></div>}
      {!loading && !loadError && !properties.length && <div className="no-result"><MagnifyingGlassIcon /><h3>هنوز فایل تأییدشده‌ای منتشر نشده است</h3><p>فایل‌های تأییدشده مدیر در این بخش نمایش داده می‌شوند.</p></div>}
      {hasFilters && filtered.length === 0 && <div className="no-result"><MagnifyingGlassIcon /><h3>فایلی با این فیلترها پیدا نشد</h3><button onClick={resetFilters}>نمایش همه فایل‌ها</button></div>}
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
          <article className="recent-card panel-card"><div className="card-heading"><h2>فایل‌های اخیر</h2><button>مشاهده همه</button></div><div className="recent-inner"><PropertyCard property={demoProperties[2]} favorite onFavorite={() => {}} onOpen={() => {}} /><div className="chart-wrap"><div className="chart-head"><span>نمودار ماه</span><button>این ماه <ChevronDownIcon /></button></div><MarketChart compact /></div></div></article>
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
