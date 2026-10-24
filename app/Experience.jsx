"use client";

import {propertyBuildingYear} from "./mobile/property-filters";
import HomeAdvancedFilters from "./site/HomeAdvancedFilters";
import ManagedSiteContent from "./site/ManagedSiteContent";
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
  Cross2Icon,
  RocketIcon,
} from "@radix-ui/react-icons";
import { useBrand } from "./brand/BrandProvider";
import { defaultFilterConfig, fetchFilterConfig } from "./mobile/filter-config";
import PublicSiteHeader from "./site/PublicSiteHeader";

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
      {onOpen ? <button className="listing-open" onClick={onOpen} aria-label={`مشاهده ${property.title}`} /> : <a className="listing-open" href={`/property/${encodeURIComponent(property.id)}`} aria-label={`مشاهده جزئیات ${property.title}`} />}
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

export function LocationFilterDialog({ open, onClose, config, filters, setFilters }) {
  const closeRef = useRef(null);
  const [activeRegionId, setActiveRegionId] = useState("");
  useEffect(() => { if (!open) return; const handler = e => e.key === "Escape" && onClose(); document.addEventListener("keydown", handler); window.setTimeout(() => closeRef.current?.focus(), 0); return () => document.removeEventListener("keydown", handler); }, [open, onClose]);
  useEffect(() => { if (open && !activeRegionId) setActiveRegionId(config.regions[0]?.id || ""); }, [open, activeRegionId, config.regions]);
  if (!open) return null;
  const selectedRegion = config.regions.find(region => region.id === activeRegionId) || config.regions[0];
  const selectedNeighborhoods = filters.neighborhoods || [];
  const removeNeighborhood = (item) => setFilters(current => {
    const neighborhoods = (current.neighborhoods || []).filter(value => value !== item);
    const regions = (current.regions || []).filter(regionName => neighborhoods.some(name => config.regions.find(region => region.name === regionName)?.neighborhoods.includes(name)));
    return { ...current, neighborhoods, regions };
  });
  const toggleNeighborhood = (item) => setFilters(current => {
    const exists = (current.neighborhoods || []).includes(item);
    const neighborhoods = exists ? current.neighborhoods.filter(value => value !== item) : [...(current.neighborhoods || []), item];
    const regions = exists
      ? (current.regions || []).filter(regionName => neighborhoods.some(name => config.regions.find(region => region.name === regionName)?.neighborhoods.includes(name)))
      : Array.from(new Set([...(current.regions || []), selectedRegion.name]));
    return { ...current, neighborhoods, regions };
  });
  return <div className="location-dialog-backdrop" onMouseDown={onClose}><section className="location-dialog" role="dialog" aria-modal="true" aria-labelledby="location-title" onMouseDown={e => e.stopPropagation()}><header><div><span>محدوده جست‌وجو</span><h2 id="location-title">منطقه و محله‌ها را انتخاب کنید</h2></div><button ref={closeRef} onClick={onClose} aria-label="بستن"><Cross2Icon /></button></header>{selectedNeighborhoods.length > 0 && <div className="location-selected" aria-label="محله‌های انتخاب‌شده"><strong>انتخاب‌های شما</strong><div>{selectedNeighborhoods.map(item => <button key={item} onClick={() => removeNeighborhood(item)}><span>{item}</span><Cross2Icon aria-hidden /></button>)}</div></div>}<div className="location-dialog-grid"><div><h3>منطقه</h3>{config.regions.map(region => <button key={region.id} className={`${activeRegionId === region.id ? "active" : ""} ${(filters.regions || []).includes(region.name) ? "selected" : ""}`} onClick={() => setActiveRegionId(region.id)}>{region.name}</button>)}</div><div><h3>محله‌های {selectedRegion?.name || "انتخابی"}</h3>{selectedRegion ? selectedRegion.neighborhoods.map(item => <button key={item} className={selectedNeighborhoods.includes(item) ? "active" : ""} aria-pressed={selectedNeighborhoods.includes(item)} onClick={() => toggleNeighborhood(item)}>{item}</button>) : <p>ابتدا یک منطقه را انتخاب کنید.</p>}</div></div><footer><button onClick={() => setFilters(current => ({ ...current, regions: [], neighborhoods: [] }))}>پاک کردن</button><button className="confirm" onClick={onClose}>اعمال {selectedNeighborhoods.length ? `${selectedNeighborhoods.length.toLocaleString("fa-IR")} محله` : "محدوده"}</button></footer></section></div>;
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
  const [locationOpen, setLocationOpen] = useState(false);
  const [filters, setFilters] = useState({ regions: [], neighborhoods: [], kind: "", budget: "", size: "", minPrice: "", maxPrice: "", minSize: "", maxSize: "", beds:"", minYear:"", maxYear:"", floors:"", units:"", amenities:[] });
  const setFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));
  const resetFilters = () => { setFilters({ regions: [], neighborhoods: [], kind: "", budget: "", size: "", minPrice: "", maxPrice: "", minSize: "", maxSize: "" }); setQuery(""); setSmartMatchIds(null); };
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
    const locationMatches = filters.neighborhoods.length ? filters.neighborhoods.some(item => p.area.includes(item)) : (!filters.regions.length || filters.regions.some(region => sameDistrict(p.district, region)));
    const d=p.details||{},year=propertyBuildingYear(d);const extraMatches=(!filters.beds||p.bedrooms>=Number(filters.beds))&&(!filters.minYear||year!==undefined&&year>=Number(filters.minYear))&&(!filters.maxYear||year!==undefined&&year<=Number(filters.maxYear))&&(!filters.floors||Number(d.totalFloors||d.floors)===Number(filters.floors))&&(!filters.units||Number(d.unitsPerFloor||d.units)===Number(filters.units))&&(!filters.amenities?.length||filters.amenities.every(x=>(d.amenities||[]).includes(x)));
    return extraMatches && smartMatches && textMatches && locationMatches && (!filters.kind || p.kind === filters.kind || (filters.kind==="آپارتمان"&&p.kind==="apartment") || (filters.kind==="پنت‌هاوس"&&p.kind==="penthouse")) && budgetMatches && sizeMatches && (!filters.minPrice || p.priceValue >= Number(filters.minPrice)) && (!filters.maxPrice || p.priceValue <= Number(filters.maxPrice)) && (!filters.minSize || p.size >= Number(filters.minSize)) && (!filters.maxSize || p.size <= Number(filters.maxSize));
  }), [properties, query, filters, smartMatchIds]);
  const hasFilters = Boolean(query || Object.values(filters).some(value => Array.isArray(value) ? value.length > 0 : Boolean(value)));
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
    if (title === "ارزش واقعی ملک") return go("/valuation");
    if (title === "بازدید سه‌بعدی") return go("/virtual-tour");
    return go("/visits/new");
  };

  return <main className="home-page" dir="rtl">
    <section className="hero-shell">
      <PublicSiteHeader overlay />
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
          <button className="search-submit" onClick={() => go(`/ai-search${query.trim()?`?q=${encodeURIComponent(query.trim())}`:""}`)}><MagicWandIcon /> جست‌وجوی هوشمند</button>
          <input value={query} onChange={(e) => { setQuery(e.target.value); setSmartMatchIds(null); }} onKeyDown={(e) => e.key === "Enter" && !searchBusy && runSearch()} placeholder="خانه مورد نظرت رو با هوش مصنوعی پیدا کن..." aria-label="جست‌وجوی هوشمند ملک" />
          <MagnifyingGlassIcon />
        </div>
        <div className="filter-row" aria-label="فیلتر فایل‌های ملک">
          <button onClick={() => setLocationOpen(true)}><DrawingPinIcon />{filters.neighborhoods.length ? `${filters.neighborhoods.length.toLocaleString("fa-IR")} محله انتخاب شده` : "منطقه و محله"}<ChevronDownIcon /></button>
          <label><span className="sr-only">نوع ملک</span><select aria-label="نوع ملک" value={filters.kind} onChange={(e) => setFilter("kind", e.target.value)}><option value="">همه ملک‌ها</option><option>آپارتمان</option><option>پنت‌هاوس</option></select><ChevronDownIcon /></label>
          <button className="more-filter" aria-expanded={moreFiltersOpen} onClick={() => setMoreFiltersOpen((open) => !open)}>فیلتر بیشتر <PlusIcon /></button>
        </div>
        {moreFiltersOpen && <HomeAdvancedFilters filters={filters} setFilter={setFilter} resetFilters={resetFilters} onShowResults={()=>{setMoreFiltersOpen(false);document.getElementById("home-property-results")?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"})}}/>}
        <div className="quick-action-grid">
          {quickActions.map(({ Icon, title, text }) => <button key={title} onClick={() => runQuickAction(title)}><Icon /><span><strong>{title}</strong><small>{text}</small></span></button>)}
        </div>
      </div>
    </section>

    <section id="home-property-results" className="featured page-section">
      <div className="section-title"><div><span>انتخاب‌های مطمئن حاتم</span><h2>فایل‌های ویژه</h2></div><button onClick={() => go("/properties/featured")}>مشاهده همه <ChevronLeftIcon /></button></div>
      <div className="listing-grid">
        {(hasFilters ? filtered : properties.filter(property => property.featured)).map((property) => <PropertyCard key={property.id} property={property} favorite={favorites.includes(property.id)} onFavorite={() => toggleFavorite(property.id)} />)}
      </div>
      {loading && <div className="no-result" role="status"><h3>در حال دریافت فایل‌های تأییدشده…</h3></div>}
      {!loading && loadError && <div className="no-result" role="alert"><h3>{loadError}</h3><button onClick={loadProperties}>تلاش دوباره</button></div>}
      {!loading && !loadError && !properties.length && <div className="no-result"><MagnifyingGlassIcon /><h3>هنوز فایل تأییدشده‌ای منتشر نشده است</h3><p>فایل‌های تأییدشده مدیر در این بخش نمایش داده می‌شوند.</p></div>}
      {!loading && !loadError && !hasFilters && properties.length > 0 && !properties.some(property => property.featured) && <div className="no-result"><MagnifyingGlassIcon /><h3>هنوز فایل ویژه‌ای انتخاب نشده است</h3><p>مدیر می‌تواند از بخش مدیریت ملک‌ها، فایل‌های منتخب را ویژه کند.</p><button onClick={() => go("/properties")}>مشاهده آرشیو املاک</button></div>}
      {hasFilters && filtered.length === 0 && <div className="no-result"><MagnifyingGlassIcon /><h3>فایلی با این فیلترها پیدا نشد</h3><button onClick={resetFilters}>نمایش همه فایل‌ها</button></div>}
    </section>

    <section className="featured ordinary-properties page-section"><div className="section-title"><div><span>فایل‌های تازه حاتم</span><h2>آرشیو املاک</h2></div><button onClick={()=>go("/properties")}>مشاهده همه <ChevronLeftIcon/></button></div><div className="listing-grid">{(hasFilters?filtered:properties).filter(property=>!property.featured).map(property=><PropertyCard key={property.id} property={property} favorite={favorites.includes(property.id)} onFavorite={()=>toggleFavorite(property.id)}/>)}</div>{!loading&&!properties.some(property=>!property.featured)&&<p>هنوز ملک معمولی منتشر نشده است.</p>}</section>
    <ManagedSiteContent slug="home"/>
    <section className="trust-strip page-section"><div><strong>+۲۴۰</strong><span>فایل تاییدشده</span></div><div><strong>۹۸٪</strong><span>رضایت مشتریان</span></div><div><strong>۱۵ سال</strong><span>تجربه بازار تهران</span></div><button onClick={() => go("/panel")}><RocketIcon /> ورود به پنل کاربری</button></section>
    {toast && <div className="toast" role="status">{toast}</div>}
    <DetailModal property={selected} onClose={() => setSelected(null)} />
    <LocationFilterDialog open={locationOpen} onClose={() => setLocationOpen(false)} config={filterConfig} filters={filters} setFilters={setFilters} />
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
