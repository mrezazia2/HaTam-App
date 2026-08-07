"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellIcon,
  BookmarkFilledIcon,
  BookmarkIcon,
  CalendarIcon,
  ChatBubbleIcon,
  ChevronLeftIcon,
  Crosshair2Icon,
  DrawingPinIcon,
  HeartFilledIcon,
  HeartIcon,
  HomeIcon,
  IdCardIcon,
  LayersIcon,
  MagnifyingGlassIcon,
  MixerHorizontalIcon,
  PersonIcon,
  Share2Icon,
} from "@radix-ui/react-icons";
import { BottomSheet, Carousel, KeyboardInput, MobileScroll, useKeyboard } from "./mobile";

type Screen = "home" | "search" | "favorites" | "profile" | "detail";

type Property = {
  id: number;
  title: string;
  area: string;
  price: string;
  meterPrice: string;
  size: number;
  beds: number;
  image: string;
  badge: string;
};

const properties: Property[] = [
  {
    id: 1,
    title: "آپارتمان ۱۲۵ متری نوساز",
    area: "نیاوران، خیابان پاسداران",
    price: "۱۲.۵ میلیارد تومان",
    meterPrice: "متری ۱۰۰ میلیون تومان",
    size: 125,
    beds: 2,
    image: "/assets/hatam/luxury-living.png",
    badge: "ویژه",
  },
  {
    id: 2,
    title: "آپارتمان ۱۴۰ متری نورگیر",
    area: "زعفرانیه، خیابان آصف",
    price: "۱۸.۸ میلیارد تومان",
    meterPrice: "متری ۱۳۴ میلیون تومان",
    size: 140,
    beds: 3,
    image: "/assets/hatam/bright-apartment.png",
    badge: "فوری",
  },
  {
    id: 3,
    title: "پنت‌هاوس ۲۱۰ متری",
    area: "فرمانیه، بلوار اندرزگو",
    price: "۳۲ میلیارد تومان",
    meterPrice: "متری ۱۵۲ میلیون تومان",
    size: 210,
    beds: 4,
    image: "/assets/hatam/penthouse.png",
    badge: "VIP",
  },
];

const categoryItems = [
  { label: "فروش", Icon: HomeIcon },
  { label: "اجاره", Icon: BookmarkIcon },
  { label: "پیش‌فروش", Icon: CalendarIcon },
  { label: "پروژه‌ها", Icon: Crosshair2Icon },
];

function resetDeviceScroll() {
  const deviceScreen = document.querySelector<HTMLElement>("[data-phone-screen]");
  if (deviceScreen) deviceScreen.scrollTop = 0;
}

function Brand() {
  return <img className="brand-logo" src="/assets/hatam/logo.png" alt="املاک حاتم" />;
}

function PropertyCard({ property, onOpen, favorite, onFavorite }: {
  property: Property;
  onOpen: () => void;
  favorite: boolean;
  onFavorite: () => void;
}) {
  return (
    <article className="property-card">
      <button className="property-hit" onClick={onOpen} aria-label={`مشاهده ${property.title}`} />
      <div className="property-media">
        <img src={property.image} alt={property.title} />
        <span className="property-badge">{property.badge}</span>
        <button className="favorite-button" onClick={(event) => { event.stopPropagation(); onFavorite(); }} aria-label="افزودن به علاقه‌مندی‌ها">
          {favorite ? <HeartFilledIcon /> : <HeartIcon />}
        </button>
      </div>
      <div className="property-copy">
        <h3>{property.title}</h3>
        <p className="property-meta">{property.size} متر · {property.beds} خواب</p>
        <p className="property-area"><DrawingPinIcon /> {property.area}</p>
        <strong>{property.price}</strong>
      </div>
    </article>
  );
}

function HomeScreen({ onOpen, favorites, onFavorite, goSearch }: {
  onOpen: (property: Property) => void;
  favorites: number[];
  onFavorite: (id: number) => void;
  goSearch: () => void;
}) {
  return (
    <MobileScroll key="home" className="app-screen hatam-scroll">
      <main className="home-screen" dir="rtl">
        <header className="home-header">
          <button className="icon-button" aria-label="اعلان‌ها"><BellIcon /></button>
          <Brand />
          <button className="icon-button" aria-label="منو"><span className="menu-lines" /></button>
        </header>

        <section className="welcome-block">
          <div>
            <p className="eyebrow">سلام حاتم</p>
            <p className="location"><DrawingPinIcon /> تهران، منطقه ۱، نیاوران</p>
          </div>
          <button className="profile-chip" aria-label="پروفایل مشاور"><PersonIcon /></button>
        </section>

        <button className="search-shell" onClick={goSearch} aria-label="جست‌وجوی ملک">
          <MagnifyingGlassIcon />
          <span>جست‌وجو در محله، منطقه یا خیابان...</span>
        </button>

        <section className="category-grid" aria-label="نوع معامله">
          {categoryItems.map(({ label, Icon }) => (
            <button className="category-button" key={label} onClick={goSearch}>
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </section>

        <section className="section-block">
          <div className="section-heading">
            <h2>فایل‌های ویژه</h2>
            <button onClick={goSearch}>مشاهده همه</button>
          </div>
          <Carousel className="property-carousel" ariaLabel="فایل‌های ویژه">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onOpen={() => onOpen(property)}
                favorite={favorites.includes(property.id)}
                onFavorite={() => onFavorite(property.id)}
              />
            ))}
          </Carousel>
        </section>

        <section className="ai-banner">
          <div className="ai-mark">AI</div>
          <div>
            <span>دستیار هوشمند حاتم</span>
            <strong>ملک مناسب شما را دقیق‌تر پیدا می‌کنیم</strong>
          </div>
          <ChevronLeftIcon />
        </section>

        <section className="section-block suggestions">
          <div className="section-heading">
            <h2>پیشنهادهای هوشمند برای شما</h2>
          </div>
          <PropertyCard
            property={properties[2]}
            onOpen={() => onOpen(properties[2])}
            favorite={favorites.includes(3)}
            onFavorite={() => onFavorite(3)}
          />
        </section>
      </main>
    </MobileScroll>
  );
}

function SearchScreen({ onOpen, favorites, onFavorite, filterOpen, setFilterOpen }: {
  onOpen: (property: Property) => void;
  favorites: number[];
  onFavorite: (id: number) => void;
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "map">("list");
  const filtered = useMemo(() => properties.filter((property) => `${property.title} ${property.area}`.includes(query)), [query]);
  return (
    <>
      <MobileScroll key="search" className="app-screen hatam-scroll">
        <main className="search-screen" dir="rtl">
          <header className="search-header">
            <h1>جست‌وجوی ملک</h1>
            <p>بین فایل‌های تاییدشده حاتم انتخاب کنید</p>
          </header>
          <div className="search-input-wrap">
            <MagnifyingGlassIcon />
            <KeyboardInput value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => window.setTimeout(resetDeviceScroll, 0)} onBlur={() => window.setTimeout(resetDeviceScroll, 0)} placeholder="محله، خیابان یا نوع ملک..." aria-label="جست‌وجوی ملک" />
            <button onClick={() => setFilterOpen(true)} aria-label="فیلترها"><MixerHorizontalIcon /></button>
          </div>
          <div className="quick-filters">
            <button className="active">خرید</button>
            <button>اجاره</button>
            <button>نوساز</button>
            <button>۲ خواب</button>
          </div>
          <div className="result-heading">
            <strong>{filtered.length} فایل مناسب</strong>
            <button className="map-switch" onClick={() => setMode((current) => current === "list" ? "map" : "list")}>
              {mode === "list" ? <><Crosshair2Icon /> روی نقشه</> : <><BookmarkIcon /> نمایش لیست</>}
            </button>
          </div>
          {mode === "map" ? (
            <div className="map-view" aria-label="نقشه فایل‌های املاک">
              <img src="/assets/hatam/north-tehran-map.png" alt="نقشه شمال تهران" />
              {filtered.map((property, index) => (
                <button key={property.id} className={`map-price marker-${index + 1}`} onClick={() => onOpen(property)}>{property.price.replace(" تومان", "")}</button>
              ))}
              <button className="locate-button" aria-label="موقعیت من"><Crosshair2Icon /></button>
            </div>
          ) : <div className="result-list">
            {filtered.map((property) => (
              <PropertyCard key={property.id} property={property} onOpen={() => onOpen(property)} favorite={favorites.includes(property.id)} onFavorite={() => onFavorite(property.id)} />
            ))}
            {filtered.length === 0 && <div className="empty-state"><MagnifyingGlassIcon /><strong>فایلی پیدا نشد</strong><span>عبارت دیگری را امتحان کنید.</span></div>}
          </div>}
        </main>
      </MobileScroll>
      <BottomSheet open={filterOpen} onOpenChange={setFilterOpen} title="فیلتر جست‌وجو" description="نتایج را دقیق‌تر کنید">
        <div className="filter-sheet" dir="rtl">
          <label>محدوده قیمت</label>
          <div className="price-range"><span>از ۵ میلیارد</span><span>تا ۳۰ میلیارد</span></div>
          <input type="range" min="5" max="50" defaultValue="30" aria-label="حداکثر قیمت" />
          <label>تعداد خواب</label>
          <div className="bed-options"><button>۱</button><button className="selected">۲</button><button>۳</button><button>۴+</button></div>
          <button className="primary-action" onPointerUp={(event) => { event.preventDefault(); event.stopPropagation(); window.setTimeout(() => setFilterOpen(false), 60); }} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setFilterOpen(false); }}>نمایش ۳ فایل</button>
        </div>
      </BottomSheet>
    </>
  );
}

function DetailScreen({ property, favorite, onFavorite, onBack }: {
  property: Property;
  favorite: boolean;
  onFavorite: () => void;
  onBack: () => void;
}) {
  return (
    <MobileScroll key="detail" className="app-screen detail-scroll">
      <main className="detail-screen" dir="rtl">
        <div className="detail-hero">
          <img src={property.image} alt={property.title} />
          <button className="detail-back" onClick={onBack} aria-label="بازگشت"><ChevronLeftIcon /></button>
          <div className="detail-tools">
            <button aria-label="اشتراک"><Share2Icon /></button>
            <button onClick={onFavorite} aria-label="علاقه‌مندی">{favorite ? <HeartFilledIcon /> : <HeartIcon />}</button>
          </div>
          <span className="photo-count">۱ / ۱۶</span>
        </div>
        <div className="detail-body">
          <span className="detail-badge">{property.badge}</span>
          <h1>{property.title}</h1>
          <p className="property-area"><DrawingPinIcon /> {property.area}</p>
          <strong className="detail-price">{property.price}</strong>
          <span className="meter-price">{property.meterPrice}</span>
          <div className="feature-row">
            <div><HomeIcon /><strong>{property.size}</strong><span>متر</span></div>
            <div><BookmarkIcon /><strong>{property.beds}</strong><span>خواب</span></div>
            <div><CalendarIcon /><strong>۱۴۰۳</strong><span>سال ساخت</span></div>
            <div><Crosshair2Icon /><strong>۱</strong><span>پارکینگ</span></div>
            <div><LayersIcon /><strong>دارد</strong><span>آسانسور</span></div>
            <div><IdCardIcon /><strong>دارد</strong><span>لابی</span></div>
          </div>
          <section className="description-card">
            <h2>توضیحات</h2>
            <p>واحدی خوش‌نقشه و نورگیر با متریال درجه‌یک، پنجره‌های سرتاسری، لابی مجلل و دسترسی سریع به امکانات محله.</p>
          </section>
          <section className="advisor-card">
            <img className="advisor-avatar" src="/assets/hatam/advisor.png" alt="حاتم امیری، مشاور املاک" />
            <div><span>مشاور اختصاصی شما</span><strong>حاتم امیری</strong></div>
            <span className="online-dot" />
          </section>
          <div className="detail-actions">
            <button className="primary-action"><CalendarIcon /> درخواست بازدید</button>
            <button><IdCardIcon /> تماس</button>
            <button><ChatBubbleIcon /> چت</button>
          </div>
        </div>
      </main>
    </MobileScroll>
  );
}

function FavoritesScreen({ favorites, onOpen, onFavorite }: { favorites: number[]; onOpen: (p: Property) => void; onFavorite: (id: number) => void }) {
  const items = properties.filter((p) => favorites.includes(p.id));
  return <MobileScroll key="favorites" className="app-screen hatam-scroll"><main className="saved-screen" dir="rtl"><header className="plain-header"><h1>علاقه‌مندی‌ها</h1><p>فایل‌هایی که برای بررسی بعدی ذخیره کرده‌اید</p></header><div className="result-list">{items.map((p) => <PropertyCard key={p.id} property={p} onOpen={() => onOpen(p)} favorite onFavorite={() => onFavorite(p.id)} />)}{!items.length && <div className="empty-state"><HeartIcon /><strong>هنوز فایلی ذخیره نکرده‌اید</strong><span>با لمس قلب، فایل‌های دلخواه اینجا می‌آیند.</span></div>}</div></main></MobileScroll>;
}

function ProfileScreen() {
  return <MobileScroll key="profile" className="app-screen hatam-scroll"><main className="profile-screen" dir="rtl"><Brand /><div className="profile-avatar"><PersonIcon /></div><h1>سلام، حاتم</h1><p>مدیریت درخواست‌ها و فایل‌های ذخیره‌شده</p><div className="profile-stats"><div><strong>۱۲</strong><span>بازدیدها</span></div><div><strong>۳</strong><span>درخواست‌ها</span></div><div><strong>۲</strong><span>مشاورها</span></div></div><div className="profile-menu"><button><CalendarIcon /><span>درخواست‌های بازدید</span><ChevronLeftIcon /></button><button><BookmarkFilledIcon /><span>فایل‌های ذخیره‌شده</span><ChevronLeftIcon /></button><button><ChatBubbleIcon /><span>گفت‌وگوها</span><ChevronLeftIcon /></button></div></main></MobileScroll>;
}

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (screen: Screen) => void }) {
  const keyboard = useKeyboard();
  const items = [
    { id: "home" as Screen, label: "خانه", Icon: HomeIcon },
    { id: "search" as Screen, label: "جست‌وجو", Icon: MagnifyingGlassIcon },
    { id: "favorites" as Screen, label: "علاقه‌مندی", Icon: HeartIcon },
    { id: "profile" as Screen, label: "پنل کاربری", Icon: PersonIcon },
  ];
  return <nav className="bottom-nav" dir="rtl" aria-label="ناوبری اصلی">{items.map(({ id, label, Icon }) => <button key={id} className={screen === id ? "active" : ""} onPointerDown={(event) => event.preventDefault()} onClick={(event) => { event.preventDefault(); event.stopPropagation(); keyboard.hide(); window.setTimeout(() => { setScreen(id); resetDeviceScroll(); keyboard.hide(); }, 100); }}><Icon /><span>{label}</span></button>)}</nav>;
}

export default function Prototype() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selected, setSelected] = useState<Property>(properties[0]);
  const [favorites, setFavorites] = useState<number[]>([2]);
  const [filterOpen, setFilterOpen] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(resetDeviceScroll);
    const immediate = window.setTimeout(resetDeviceScroll, 0);
    const settled = window.setTimeout(resetDeviceScroll, 350);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(immediate);
      window.clearTimeout(settled);
    };
  }, [screen]);
  useEffect(() => {
    const guard = window.setInterval(resetDeviceScroll, 120);
    return () => window.clearInterval(guard);
  }, []);
  const toggleFavorite = (id: number) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const openProperty = (property: Property) => { setSelected(property); setScreen("detail"); };
  return (
    <div className="hatam-app">
      {screen === "home" && <HomeScreen onOpen={openProperty} favorites={favorites} onFavorite={toggleFavorite} goSearch={() => setScreen("search")} />}
      {screen === "search" && <SearchScreen onOpen={openProperty} favorites={favorites} onFavorite={toggleFavorite} filterOpen={filterOpen} setFilterOpen={setFilterOpen} />}
      {screen === "favorites" && <FavoritesScreen favorites={favorites} onOpen={openProperty} onFavorite={toggleFavorite} />}
      {screen === "profile" && <ProfileScreen />}
      {screen === "detail" && <DetailScreen property={selected} favorite={favorites.includes(selected.id)} onFavorite={() => toggleFavorite(selected.id)} onBack={() => setScreen("home")} />}
      {screen !== "detail" && <BottomNav screen={screen} setScreen={setScreen} />}
    </div>
  );
}
