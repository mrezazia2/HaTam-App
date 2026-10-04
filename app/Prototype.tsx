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
  MoonIcon,
  SunIcon,
  CheckCircledIcon,
  Cross2Icon,
  EnvelopeClosedIcon,
  HamburgerMenuIcon,
  PlusCircledIcon,
  RocketIcon,
  PaperPlaneIcon,
  SpeakerLoudIcon,
  StarIcon,
  GlobeIcon,
  CameraIcon,
  ExternalLinkIcon,
  MobileIcon,
  LockClosedIcon,
} from "@radix-ui/react-icons";
import { BottomSheet, Carousel, KeyboardInput, MobileScroll, useKeyboard } from "./mobile";
import { useBrand } from "./brand/BrandProvider";
import {mobileInput} from "./auth/digits";
import { defaultFilterConfig, fetchFilterConfig, readFilterConfig, type FilterConfig } from "./mobile/filter-config";
import { createUrgentSale } from "./mobile/urgent-sale-store";
import { defaultAppMenuItems, type AppMenuItem } from "./mobile/app-menu-config";
import { useTheme } from "./theme/ThemeProvider";
import {defaultContactConfig,type ContactConfig} from "./contact/config";
import "./contact/contact.css";
import "./contact/contact-fix.css";
import "./shared-app-header.css";
import "./shared-app-header-fix.css";
import "./app-login.css";
import "./app-login-readability.css";
import "./cooperate.css";
import "./cooperate-form.css";
import "./cooperate-adjustments.css";
import "./cooperate-row-fix.css";
import "./cooperate-button-fix.css";
import {defaultCooperateConfig,type CooperateConfig,type CooperateMethod} from "./cooperate/config";
import AppPasswordLogin from "./auth/AppPasswordLogin";
import ConsultantDirectory from "./consultants/ConsultantDirectory";
import PropertyMediaUploader,{type PropertyMedia} from "./components/PropertyMediaUploader";
import MapLocationPicker from "./components/MapLocationPicker";
import TrustExperience from "./trust/TrustExperience";
import "./trust/trust.css";
import "./auth/app-password-app-fix.css";

import {numericInput,matchesProperty,type PropertyFilters} from "./mobile/property-filters";

type Screen = "entry" | "home" | "filter" | "urgent" | "submit-choice" | "consultant-submit" | "search" | "favorites" | "profile" | "detail" | "ai-chat" | "contact" | "trust" | "cooperate" | "cooperate-form" | "consultants" | "login";
type FilterMode = "manual" | "quick";

type Property = {
  id: string | number;
  title: string;
  area: string;
  price: string;
  meterPrice: string;
  size: number;
  beds: number;
  image: string;
  badge: string;
  amount?:number; createdAt?:string; amenities?:string[]; district?:string; buildingYear?:number;
  transactionType?:string; description?:string; latitude?:number|null; longitude?:number|null;
};

type ArchiveSort = "newest" | "oldest" | "featured" | "expensive" | "affordable";

const previewProperties: Property[] = [
  {
    id: 1,
    title: "آپارتمان ۱۲۵ متری نوساز",
    area: "نیاوران، خیابان پاسداران",
    price: "۱۲.۵ میلیارد تومان",
    meterPrice: "متری ۱۰۰ میلیون تومان",
    size: 125,
    beds: 2,
    image: "/assets/hatam/luxury-living.webp",
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
    image: "/assets/hatam/bright-apartment.webp",
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
    image: "/assets/hatam/penthouse.webp",
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
  const { settings } = useBrand();
  return <img className="brand-logo" src={settings.logoUrl} alt={settings.brandName} />;
}

function EntryScreen({continueAsGuest,openLogin}:{continueAsGuest:()=>void;openLogin:(role:"user"|"consultant"|"agency",mode:"login"|"register")=>void}){
  const {settings}=useBrand();
  const roles=[{key:"user",title:"خریدار و فروشنده",meta:"کاربر معمولی",Icon:PersonIcon},{key:"consultant",title:"مشاور املاک",meta:"پنل حرفه‌ای",Icon:IdCardIcon},{key:"agency",title:"آژانس املاک",meta:"حساب سازمانی",Icon:HomeIcon}];
  return <main className="app-entry" dir="rtl"><div className="app-entry-shade"/><div className="app-entry-content"><img src={settings.logoUrl} alt={settings.brandName}/><span>به حاتم خوش آمدید</span><h1>{settings.slogan}</h1><p>نوع حساب خود را برای ورود یا ثبت‌نام انتخاب کنید.</p><div className="app-role-list">{roles.map(({key,title,meta,Icon})=><article key={key}><Icon/><div><strong>{title}</strong><small>{meta}</small></div><button onClick={()=>openLogin(key as "user"|"consultant"|"agency","login")}>ورود</button><button onClick={()=>openLogin(key as "user"|"consultant"|"agency","register")}>ثبت‌نام</button></article>)}</div><button className="app-guest" onClick={continueAsGuest}>فعلاً بدون ورود ملک‌ها را ببینم</button></div></main>
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

function usePublishedProperties(){
 const [items,setItems]=useState<Property[]>([]),[error,setError]=useState("");
 useEffect(()=>{const controller=new AbortController();fetch("/api/properties",{signal:controller.signal,cache:"no-store"}).then(r=>{if(!r.ok)throw new Error();return r.json()}).then(data=>setItems((data.items||[]).map((row:any)=>{let details:any={};try{details=JSON.parse(row.description||"{}")}catch{}return {district:row.district,buildingYear:Number(details.buildYear||details.buildingYear||details.age)||undefined,id:row.id,title:row.title,area:row.address,size:row.area,beds:row.bedrooms,amount:row.price,price:Number(row.price).toLocaleString("fa-IR")+" تومان",meterPrice:Math.round(row.price/Math.max(1,row.area)).toLocaleString("fa-IR")+" تومان",image:row.coverImage||"",badge:row.featured?"ویژه":"",createdAt:row.createdAt,amenities:Array.isArray(details.amenities)?details.amenities.filter((x:unknown)=>typeof x==="string"):[],transactionType:row.transactionType,description:row.description,latitude:row.latitude,longitude:row.longitude}}))).catch(()=>{if(!controller.signal.aborted)setError("دریافت فایل‌ها انجام نشد؛ اتصال را بررسی کنید.")});return()=>controller.abort()},[]);
 return {properties:items,error};
}

function HomeScreen({ filters,onOpen, favorites, onFavorite, goSearch, openAiChat, openContact, openTrust, openCooperate, openConsultants, openFilter, openUrgent, dark, toggleTheme }: {
  filters?:PropertyFilters;
  onOpen: (property: Property) => void;
  favorites: Array<string | number>;
  onFavorite: (id: string | number) => void;
  goSearch: () => void;
  openAiChat: () => void;
  openContact: () => void;
  openTrust: () => void;
  openCooperate: () => void;
  openConsultants: () => void;
  openFilter: (mode: FilterMode) => void;
  openUrgent: () => void;
  dark: boolean;
  toggleTheme: () => void;
}) {
  const {properties,error:catalogError}=usePublishedProperties();
  const [query, setQuery] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<ArchiveSort>("newest");
  const [menuOpen,setMenuOpen]=useState(false);
  const [menuItems,setMenuItems]=useState<AppMenuItem[]>(defaultAppMenuItems);
  useEffect(()=>{fetch("/api/app-menu",{cache:"no-store"}).then(response=>response.ok?response.json():Promise.reject()).then(data=>setMenuItems((data.items||defaultAppMenuItems).filter((item:AppMenuItem)=>item.enabled).sort((a:AppMenuItem,b:AppMenuItem)=>a.sortOrder-b.sortOrder))).catch(()=>setMenuItems(defaultAppMenuItems))},[]);
  useEffect(()=>{if(!menuOpen)return;const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setMenuOpen(false)};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close)},[menuOpen]);
  const sortLabels: Record<ArchiveSort,string> = {newest:"جدیدترین",oldest:"قدیمی‌ترین",featured:"ویژه‌ترین",expensive:"گران‌ترین",affordable:"مقرون‌به‌صرفه‌ترین"};
  const archive = useMemo(() => {
    const matched = properties.filter((property) => `${property.title} ${property.area}`.includes(query.trim())&&(!filters||matchesProperty(property,filters)));
    if (sort === "oldest") return [...matched].reverse();
    if (sort === "featured") return [...matched].sort((a,b) => Number(b.badge === "ویژه" || b.badge === "VIP") - Number(a.badge === "ویژه" || a.badge === "VIP"));
    if (sort === "expensive") return [...matched].sort((a,b) => (b.amount||0) - (a.amount||0));
    if (sort === "affordable") return [...matched].sort((a,b) => (a.amount||0) - (b.amount||0));
    return matched;
  }, [query, sort, properties,filters]);
  const amenities: Record<number,string[]> = {1:["پارکینگ","انباری","آسانسور","بالکن"],2:["پارکینگ","آسانسور","لابی"],3:["پارکینگ","انباری","آسانسور","تراس"]};
  const menuIcons:Record<string,typeof HomeIcon>={home:HomeIcon,heart:HeartIcon,rocket:RocketIcon,person:PersonIcon,bookmark:BookmarkFilledIcon,consultant:IdCardIcon,contact:EnvelopeClosedIcon,plus:PlusCircledIcon,login:PersonIcon};
  const runMenuAction=(item:AppMenuItem)=>{setMenuOpen(false);if(item.action==="home"){window.scrollTo({top:0,behavior:"smooth"});return}if(item.action==="urgent"||item.action==="register-property"){openUrgent();return}if(item.action==="featured"){setSort("featured");window.setTimeout(()=>document.querySelector(".archive-section")?.scrollIntoView({behavior:"smooth"}),100);return}if(item.action==="trust"||(item.action==="url"&&item.target==="/trust")){openTrust();return}if(item.action==="cooperate"||(item.action==="consultants"&&item.id==="cooperate")){openCooperate();return}if(item.action==="consultants"){openConsultants();return}if(item.action==="contact"){openContact();return}if(item.action==="login"){window.location.href=item.target||"/login/user";return}if(item.action==="url"&&item.target)window.location.href=item.target};
  return (
    <>
    <MobileScroll key="home" className="app-screen hatam-scroll app-home-scroll">
      <main className="home-screen" dir="rtl">
        <header className="home-header">
          <button className="icon-button theme-button" onClick={toggleTheme} aria-label={dark?"فعال‌کردن حالت روشن":"فعال‌کردن حالت تیره"}>{dark?<SunIcon/>:<MoonIcon/>}</button>
          <Brand />
          <button className="icon-button" aria-label="بازکردن منو" aria-expanded={menuOpen} onClick={()=>setMenuOpen(true)}><span className="menu-lines" /></button>
        </header>
        <p className="home-tagline">خرید و فروش تخصصی املاک و مستغلات شرق تهران</p>
        <div className="home-smart-search">
          <button className="manual-filter" onClick={() => openFilter("manual")}><MixerHorizontalIcon/><span>فیلتر دستی</span></button>
          <label><MagnifyingGlassIcon/><KeyboardInput value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="جست‌وجو در بین فایل‌های ملکی..." aria-label="جست‌وجوی ملک"/></label>
          <button className="ai-filter" onClick={openAiChat}><span>AI</span><small>فیلتر هوشمند</small></button>
        </div>
        <section className="home-quick-actions" aria-label="دسترسی سریع">
          {[{label:"خرید سریع",Icon:HomeIcon,action:()=>openFilter("quick")},{label:"قیمت‌گذاری",Icon:Crosshair2Icon,action:goSearch},{label:"فایل ویژه",Icon:BookmarkFilledIcon,action:()=>setSort("featured")},{label:"فروش فوری",Icon:Share2Icon,action:openUrgent}].map(({label,Icon,action})=><button key={label} onClick={action}><Icon/><span>{label}</span></button>)}
        </section>
        <section className="archive-section">
          <button className="archive-sort-trigger" onClick={()=>setSortOpen(!sortOpen)}><span>مرتب‌سازی بر اساس</span><strong>{sortLabels[sort]}</strong><ChevronLeftIcon/></button>
          {sortOpen&&<div className="archive-sort-panel" role="dialog" aria-label="مرتب‌سازی فایل‌ها">{(["newest","oldest","featured","expensive","affordable"] as ArchiveSort[]).map(value=><button className={sort===value?"selected":""} key={value} onClick={()=>{setSort(value);setSortOpen(false)}}><i/>{sortLabels[value]}</button>)}</div>}
          <div className="archive-list">
            {archive.map((property,index)=><article className="archive-property" key={property.id}>
              <button className="property-hit" onClick={()=>onOpen(property)} aria-label={`مشاهده ${property.title}`}/>
              <img src={property.image} alt={property.title}/>
              <div className="archive-copy"><h2>{property.title}</h2><p><DrawingPinIcon/>{property.area}</p><div>{(property.amenities||[]).map(item=><span key={item}>{item}</span>)}</div></div>
              <aside><strong>{property.price}</strong><time>{property.createdAt?new Date(property.createdAt).toLocaleDateString("fa-IR"):""}</time><button onClick={(event)=>{event.stopPropagation();onFavorite(property.id)}} aria-label="علاقه‌مندی">{favorites.includes(property.id)?<HeartFilledIcon/>:<HeartIcon/>}</button></aside>
            </article>)}
            {!archive.length&&<div className="home-empty"><MagnifyingGlassIcon/><strong>{catalogError||"ملکی با این جست‌وجو پیدا نشد"}</strong></div>}
          </div>
        </section>
      </main>
    </MobileScroll>
    {menuOpen&&<div className="app-menu-backdrop" role="presentation" onMouseDown={()=>setMenuOpen(false)}><aside className="app-menu-drawer" role="dialog" aria-modal="true" aria-label="منوی اپ حاتم" onMouseDown={event=>event.stopPropagation()}><header><Brand/><button onClick={()=>setMenuOpen(false)} aria-label="بستن منو"><Cross2Icon/></button></header><nav>{menuItems.filter(item=>item.variant==="item").map(item=>{const Icon=menuIcons[item.icon]||HomeIcon;return <button key={item.id} onClick={()=>runMenuAction(item)}><Icon/><span>{item.label}</span></button>})}</nav>{menuItems.filter(item=>item.variant==="cta").map(item=>{const Icon=menuIcons[item.icon]||PlusCircledIcon;return <button key={item.id} className="app-menu-urgent" onClick={()=>runMenuAction(item)}><Icon/><span><strong>{item.label}</strong>{item.subtitle&&<small>{item.subtitle}</small>}</span></button>})}</aside></div>}
    </>
  );
}

function numericValue(value:string){return value.replace(/[۰-۹]/g,digit=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g,digit=>String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/\D/g,"")}
function faMoney(value:string){const digits=numericValue(value);return digits?Number(digits).toLocaleString("fa-IR"):""}

function FilterScreen({mode,onBack,onApply}:{mode:FilterMode;onBack:()=>void;onApply:(filters:PropertyFilters)=>void}){
  const [config,setConfig]=useState<FilterConfig>(defaultFilterConfig);
  const [more,setMore]=useState(mode==="manual");
  const [minPrice,setMinPrice]=useState("5000000000"),[maxPrice,setMaxPrice]=useState("20000000000");
  const [minArea,setMinArea]=useState("70"),[maxArea,setMaxArea]=useState("250"),[beds,setBeds]=useState(2);
  const [regions,setRegions]=useState<string[]>([]),[neighborhoods,setNeighborhoods]=useState<string[]>([]),[minBuildYear,setMinBuildYear]=useState("1385"),[maxBuildYear,setMaxBuildYear]=useState("1405");
  const [amenities,setAmenities]=useState<string[]>(["پارکینگ","آسانسور"]);
  const [mapOpen,setMapOpen]=useState(false),[latitude,setLatitude]=useState<number|null>(null),[longitude,setLongitude]=useState<number|null>(null),[radius,setRadius]=useState(500);
  const toggle=(list:string[],value:string,setter:(next:string[])=>void)=>setter(list.includes(value)?list.filter(item=>item!==value):[...list,value]);
  useEffect(()=>{fetchFilterConfig().then(setConfig);const sync=(event:Event)=>setConfig((event as CustomEvent<FilterConfig>).detail||readFilterConfig());const syncStorage=(event:StorageEvent)=>{if(event.key==="hatam-filter-config-v1")setConfig(readFilterConfig())};window.addEventListener("hatam-filter-config-changed",sync);window.addEventListener("storage",syncStorage);return()=>{window.removeEventListener("hatam-filter-config-changed",sync);window.removeEventListener("storage",syncStorage)}},[]);
  useEffect(()=>{const years=config.buildingAges.filter(value=>/^\d{4}$/.test(value)).sort((a,b)=>Number(a)-Number(b));if(!years.length)return;if(!years.includes(minBuildYear))setMinBuildYear(years[0]);if(!years.includes(maxBuildYear))setMaxBuildYear(years[years.length-1])},[config.buildingAges,minBuildYear,maxBuildYear]);
  const visibleNeighborhoods=config.regions.filter(region=>regions.includes(region.id)).flatMap(region=>region.neighborhoods.map(name=>({key:`${region.id}-${name}`,name,region:region.name})));
  const buildingYears=config.buildingAges.filter(value=>/^\d{4}$/.test(value)).sort((a,b)=>Number(b)-Number(a));
  const toggleRegion=(id:string)=>{const next=regions.includes(id)?regions.filter(item=>item!==id):[...regions,id];setRegions(next);const allowed=new Set(config.regions.filter(region=>next.includes(region.id)).flatMap(region=>region.neighborhoods));setNeighborhoods(current=>current.filter(item=>allowed.has(item)))};
  return <MobileScroll key="filter" className="app-screen hatam-scroll app-filter-scroll"><main className="filter-page" dir="rtl">
    <header className="filter-logo-row"><Brand/></header>
    <div className="filter-title"><button onClick={onBack} aria-label="بازگشت"><ChevronLeftIcon/></button><div><h1>{mode==="manual"?"فیلتر دستی":"خرید سریع"}</h1><p>محدوده موردنظرتان را انتخاب کنید</p></div><span/></div>
    <section className="filter-card"><h2>قیمت ملک</h2><p>همه مبالغ بر اساس تومان هستند</p><div className="dual-fields price-range-fields"><label><span>از</span><input inputMode="numeric" value={faMoney(minPrice)} onChange={e=>setMinPrice(numericInput(e.target.value))}/><small>تومان</small></label><label><span>تا</span><input inputMode="numeric" value={faMoney(maxPrice)} onChange={e=>setMaxPrice(numericInput(e.target.value))}/><small>تومان</small></label></div></section>
    {mode==="quick"&&!more&&<button className="more-filters" onClick={()=>setMore(true)}><MixerHorizontalIcon/>فیلترهای بیشتر<ChevronLeftIcon/></button>}
    {more&&<>
      <section className="filter-card"><h2>موقعیت ملک</h2><div className="select-label"><span>منطقه <small>چند انتخابی</small></span><div className="choice-row">{config.regions.map(item=><button className={regions.includes(item.id)?"active":""} key={item.id} onClick={()=>toggleRegion(item.id)}>{item.name}</button>)}</div></div>{regions.length>0&&<div className="select-label neighborhood-picker"><span>محله‌های مناطق انتخاب‌شده <small>چند انتخابی</small></span><div className="neighborhood-list">{visibleNeighborhoods.map(item=><button className={neighborhoods.includes(item.name)?"active":""} key={item.key} onClick={()=>toggle(neighborhoods,item.name,setNeighborhoods)}><span>{item.name}</span><small>{item.region}</small></button>)}</div></div>}<button className={`map-search-button ${latitude!=null?"active":""}`} onClick={()=>setMapOpen(value=>!value)}><DrawingPinIcon/><span><strong>{latitude!=null?"محدوده روی نقشه انتخاب شد":"جست‌وجو روی نقشه"}</strong><small>{latitude!=null?`شعاع ${radius.toLocaleString("fa-IR")} متر`:"انتخاب محدوده دلخواه"}</small></span><ChevronLeftIcon/></button>{mapOpen&&<MapLocationPicker compact latitude={latitude} longitude={longitude} locationMode="area" radius={radius} onRadiusChange={setRadius} onChange={(lat,lng)=>{setLatitude(lat);setLongitude(lng)}}/>}{latitude!=null&&<button className="map-filter-clear" onClick={()=>{setLatitude(null);setLongitude(null)}}>حذف محدوده نقشه</button>}</section>
      <section className="filter-card"><h2>مشخصات ملک</h2><label className="field-caption">متراژ <small>متر مربع</small></label><div className="dual-fields area-fields"><label><span>از</span><input inputMode="numeric" value={minArea} onChange={e=>setMinArea(numericInput(e.target.value))}/><small>متر</small></label><label><span>تا</span><input inputMode="numeric" value={maxArea} onChange={e=>setMaxArea(numericInput(e.target.value))}/><small>متر</small></label></div><div className="stepper-row"><span>تعداد خواب</span><div><button onClick={()=>setBeds(Math.max(0,beds-1))}>−</button><strong>{beds.toLocaleString("fa-IR")}</strong><button onClick={()=>setBeds(beds+1)}>+</button></div></div><label className="field-caption build-year-caption">سال ساخت <small>بازه زمانی</small></label><div className="dual-fields build-year-range"><label><span>از</span><select aria-label="سال ساخت از" value={minBuildYear} onChange={e=>{const value=e.target.value;setMinBuildYear(value);if(Number(value)>Number(maxBuildYear))setMaxBuildYear(value)}}>{buildingYears.map(value=><option key={value} value={value}>{Number(value).toLocaleString("fa-IR",{useGrouping:false})}</option>)}</select><small>سال</small></label><label><span>تا</span><select aria-label="سال ساخت تا" value={maxBuildYear} onChange={e=>{const value=e.target.value;setMaxBuildYear(value);if(Number(value)<Number(minBuildYear))setMinBuildYear(value)}}>{buildingYears.map(value=><option key={value} value={value}>{Number(value).toLocaleString("fa-IR",{useGrouping:false})}</option>)}</select><small>سال</small></label></div></section>
      <section className="filter-card"><h2>امکانات</h2><div className="amenity-toggles">{config.amenities.map(item=><button className={amenities.includes(item)?"active":""} aria-pressed={amenities.includes(item)} key={item} onClick={()=>toggle(amenities,item,setAmenities)}><span>{item}</span><i/></button>)}</div></section>
    </>}
    <button className="show-files-button" onClick={()=>onApply({minPrice,maxPrice,...(more?{minArea,maxArea,beds,regions,neighborhoods,minBuildYear,maxBuildYear,amenities,...(latitude!=null&&longitude!=null?{latitude,longitude,radius}:{})}:{})})}>مشاهده فایل‌ها</button>
  </main></MobileScroll>
}

function UrgentSaleScreen({onBack,onDone,entry="default"}:{onBack:()=>void;onDone:()=>void;entry?:"default"|"trust"|"cooperate"}){
  const config=readFilterConfig();
  const [form,setForm]=useState({firstName:"",lastName:"",address:"",area:"",bedrooms:2,buildingAge:"",floor:1,unitsPerFloor:1,expectedPrice:"",locationSet:false});
  const [amenities,setAmenities]=useState<string[]>(["پارکینگ"]),[errors,setErrors]=useState<Record<string,string>>({}),[success,setSuccess]=useState(false),[submitting,setSubmitting]=useState(false);
  const set=(key:string,value:unknown)=>setForm(current=>({...current,[key]:value}));
  const toggleAmenity=(value:string)=>setAmenities(current=>current.includes(value)?current.filter(item=>item!==value):[...current,value]);
  const submit=async()=>{const next:Record<string,string>={};if(form.firstName.trim().length<2)next.firstName="نام را کامل وارد کنید.";if(form.lastName.trim().length<2)next.lastName="نام خانوادگی را کامل وارد کنید.";if(form.address.trim().length<8)next.address="آدرس کامل ملک را وارد کنید.";if(!form.locationSet)next.location="لوکیشن ملک را ثبت کنید.";if(Number(form.area)<20)next.area="متراژ معتبر وارد کنید.";if(!/^\d{4}$/.test(form.buildingAge)||Number(form.buildingAge)<1300||Number(form.buildingAge)>1405)next.buildingAge="سال ساخت معتبر وارد کنید.";if(Number(form.expectedPrice)<1000000)next.expectedPrice="قیمت مدنظر را به تومان وارد کنید.";setErrors(next);if(Object.keys(next).length)return;setSubmitting(true);try{await createUrgentSale({firstName:form.firstName.trim(),lastName:form.lastName.trim(),address:form.address.trim(),locationSet:true,area:Number(form.area),bedrooms:form.bedrooms,buildingAge:Number(form.buildingAge),floor:form.floor,unitsPerFloor:form.unitsPerFloor,amenities,expectedPrice:Number(form.expectedPrice)});setSuccess(true)}catch{setErrors({submit:"ثبت درخواست انجام نشد؛ اتصال را بررسی و دوباره تلاش کنید."})}finally{setSubmitting(false)}};
  return <MobileScroll key="urgent" className="app-screen hatam-scroll urgent-scroll"><main className="urgent-page" dir="rtl"><header className="filter-logo-row"><Brand/></header><div className="filter-title"><button onClick={onBack} aria-label="بازگشت"><ChevronLeftIcon/></button><div><h1>{entry==="default"?"فروش فوری ملک":"ثبت مشخصات ملک"}</h1><p>ثبت درخواست ارزیابی سریع</p></div><span/></div>{entry!=="cooperate"&&<div className="urgent-intro"><strong>{entry==="trust"?"برای فروش ملک شما در سریع‌ترین زمان ممکن و مناسب‌ترین قیمت فقط کافیه مشخصات زیر را پر کنید:":"اگه عجله داری و در ۷۲ ساعت می‌خوای ملکت رو بفروشی، مشخصات زیر رو پر کن."}</strong><span>کارشناسان حاتم خیلی سریع درخواست شما را بررسی می‌کنند.</span></div>}
    <section className="filter-card urgent-card"><h2>اطلاعات مالک</h2><div className="dual-fields text-fields"><label><span>نام *</span><input value={form.firstName} onChange={e=>set("firstName",e.target.value)} aria-invalid={!!errors.firstName}/></label><label><span>نام خانوادگی *</span><input value={form.lastName} onChange={e=>set("lastName",e.target.value)} aria-invalid={!!errors.lastName}/></label></div>{(errors.firstName||errors.lastName)&&<p className="form-error">{errors.firstName||errors.lastName}</p>}<label className="wide-text-field"><span>آدرس کامل ملک *</span><input value={form.address} onChange={e=>set("address",e.target.value)} aria-invalid={!!errors.address}/></label>{errors.address&&<p className="form-error">{errors.address}</p>}<button className={`location-register ${form.locationSet?"done":""}`} onClick={()=>set("locationSet",true)}><DrawingPinIcon/><span>{form.locationSet?"لوکیشن ثبت شد":"ثبت لوکیشن ملک"}</span>{form.locationSet&&<CheckCircledIcon/>}</button>{errors.location&&<p className="form-error">{errors.location}</p>}</section>
    <section className="filter-card urgent-card"><h2>مشخصات ملک</h2><div className="triple-fields"><label><span>متراژ *</span><input inputMode="numeric" value={form.area} onChange={e=>set("area",numericInput(e.target.value))}/><small>متر</small></label><label><span>تعداد خواب</span><input inputMode="numeric" value={form.bedrooms} onChange={e=>set("bedrooms",Number(numericInput(e.target.value)))}/></label><label><span>سال ساخت *</span><input inputMode="numeric" value={form.buildingAge} onChange={e=>set("buildingAge",numericInput(e.target.value).slice(0,4))}/></label></div>{(errors.area||errors.buildingAge)&&<p className="form-error">{errors.area||errors.buildingAge}</p>}<div className="two-steppers"><Counter label="طبقه" value={form.floor} setValue={value=>set("floor",value)}/><Counter label="تعداد واحد در طبقه" value={form.unitsPerFloor} setValue={value=>set("unitsPerFloor",value)}/></div></section>
    <section className="filter-card urgent-card"><h2>امکانات</h2><div className="amenity-toggles">{config.amenities.map(item=><button className={amenities.includes(item)?"active":""} aria-pressed={amenities.includes(item)} key={item} onClick={()=>toggleAmenity(item)}><span>{item}</span><i/></button>)}</div></section>
    <section className="filter-card urgent-card"><label className="price-text-field"><span>قیمت مدنظر شما *</span><div><input inputMode="numeric" value={form.expectedPrice?faMoney(form.expectedPrice):""} onChange={e=>set("expectedPrice",numericValue(e.target.value))}/><small>تومان</small></div></label>{errors.expectedPrice&&<p className="form-error">{errors.expectedPrice}</p>}</section>{errors.submit&&<p className="form-error">{errors.submit}</p>}<button className="show-files-button urgent-submit" disabled={submitting} onClick={submit}>{submitting?"در حال ثبت…":"ثبت درخواست فروش فوری"}</button>
    {success&&<div className="success-backdrop" role="dialog" aria-label="ثبت موفق درخواست"><div className="success-popup"><CheckCircledIcon/><h2>درخواست شما ثبت شد</h2><p>کارشناسان ما خیلی سریع با شما تماس می‌گیرند.</p><button onClick={onDone}>بازگشت به صفحه اصلی</button></div></div>}
  </main></MobileScroll>
}

function Counter({label,value,setValue}:{label:string;value:number;setValue:(value:number)=>void}){return <div className="counter-card"><span>{label}</span><div><button onClick={()=>setValue(Math.max(0,value-1))}>−</button><strong>{value.toLocaleString("fa-IR")}</strong><button onClick={()=>setValue(value+1)}>+</button></div></div>}

function SearchScreen({ onOpen, favorites, onFavorite, filterOpen, setFilterOpen }: {
  onOpen: (property: Property) => void;
  favorites: Array<string | number>;
  onFavorite: (id: string | number) => void;
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
}) {
  const { properties, error: catalogError } = usePublishedProperties();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "map">("list");
  const [transaction, setTransaction] = useState<"sale" | "rent">("sale");
  const [parkingOnly, setParkingOnly] = useState(false);
  const [minBeds, setMinBeds] = useState(0);
  const [draftMaxPrice, setDraftMaxPrice] = useState(100);
  const [maxPrice, setMaxPrice] = useState(100);
  const [draftBeds, setDraftBeds] = useState(0);
  const [geoMessage, setGeoMessage] = useState("");
  const filtered = useMemo(() => properties.filter((property) => {
    const haystack = `${property.title} ${property.area}`.toLocaleLowerCase("fa-IR");
    const normalizedTransaction = property.transactionType === "rent" ? "rent" : "sale";
    return haystack.includes(query.trim().toLocaleLowerCase("fa-IR"))
      && normalizedTransaction === transaction
      && (!parkingOnly || (property.amenities || []).includes("پارکینگ"))
      && property.beds >= minBeds
      && (property.amount || 0) <= maxPrice * 1_000_000_000;
  }), [query, properties, transaction, parkingOnly, minBeds, maxPrice]);
  const markerStyle=(property:Property,index:number)=>{
    if(property.latitude!=null&&property.longitude!=null){
      const x=Math.max(5,Math.min(95,((property.longitude-51.20)/(51.65-51.20))*100));
      const y=Math.max(6,Math.min(94,(1-(property.latitude-35.55)/(35.90-35.55))*100));
      return {left:`${x}%`,top:`${y}%`,right:"auto",bottom:"auto"};
    }
    return {left:`${18+(index%3)*29}%`,top:`${22+(Math.floor(index/3)%3)*27}%`,right:"auto",bottom:"auto"};
  };
  const locate=()=>{
    if(!navigator.geolocation){setGeoMessage("موقعیت‌یابی در این دستگاه پشتیبانی نمی‌شود.");return}
    setGeoMessage("در حال دریافت موقعیت شما…");
    navigator.geolocation.getCurrentPosition(()=>setGeoMessage("موقعیت شما دریافت شد؛ فایل‌های نزدیک روی نقشه قابل مشاهده‌اند."),()=>setGeoMessage("دسترسی موقعیت فعال نشد."),{enableHighAccuracy:false,timeout:7000});
  };
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
            <button className={transaction==="sale"?"active":""} aria-pressed={transaction==="sale"} onClick={()=>setTransaction("sale")}>خرید</button>
            <button className={transaction==="rent"?"active":""} aria-pressed={transaction==="rent"} onClick={()=>setTransaction("rent")}>اجاره</button>
            <button className={parkingOnly?"active":""} aria-pressed={parkingOnly} onClick={()=>setParkingOnly(value=>!value)}>پارکینگ</button>
            <button className={minBeds===2?"active":""} aria-pressed={minBeds===2} onClick={()=>setMinBeds(value=>value===2?0:2)}>۲ خواب</button>
          </div>
          <div className="result-heading">
            <strong>{filtered.length} فایل مناسب</strong>
            <button className="map-switch" onClick={() => setMode((current) => current === "list" ? "map" : "list")}>
              {mode === "list" ? <><Crosshair2Icon /> روی نقشه</> : <><BookmarkIcon /> نمایش لیست</>}
            </button>
          </div>
          {mode === "map" ? (
            <div className="map-view" aria-label="نقشه فایل‌های املاک">
              <img src="/assets/hatam/north-tehran-map.webp" alt="نقشه شمال تهران" />
              {filtered.map((property, index) => (
                <button key={property.id} style={markerStyle(property,index)} className="map-price" onClick={() => onOpen(property)}>{property.price.replace(" تومان", "")}</button>
              ))}
              <button className="locate-button" aria-label="موقعیت من" onClick={locate}><Crosshair2Icon /></button>
              {geoMessage&&<p className="map-geo-message" role="status">{geoMessage}</p>}
            </div>
          ) : <div className="result-list">
            {filtered.map((property) => (
              <PropertyCard key={property.id} property={property} onOpen={() => onOpen(property)} favorite={favorites.includes(property.id)} onFavorite={() => onFavorite(property.id)} />
            ))}
            {filtered.length === 0 && <div className="empty-state"><MagnifyingGlassIcon /><strong>فایلی پیدا نشد</strong><span>عبارت دیگری را امتحان کنید.</span></div>}
            {catalogError&&<div className="empty-state"><strong>ارتباط با آرشیو برقرار نشد</strong><span>{catalogError}</span></div>}
          </div>}
        </main>
      </MobileScroll>
      <BottomSheet open={filterOpen} onOpenChange={setFilterOpen} title="فیلتر جست‌وجو" description="نتایج را دقیق‌تر کنید">
        <div className="filter-sheet" dir="rtl">
          <label>محدوده قیمت</label>
          <div className="price-range"><span>از صفر</span><span>تا {draftMaxPrice.toLocaleString("fa-IR")} میلیارد تومان</span></div>
          <input type="range" min="1" max="100" value={draftMaxPrice} onChange={event=>setDraftMaxPrice(Number(event.target.value))} aria-label="حداکثر قیمت" />
          <label>تعداد خواب</label>
          <div className="bed-options">{[0,1,2,3,4].map(value=><button key={value} className={draftBeds===value?"selected":""} aria-pressed={draftBeds===value} onClick={()=>setDraftBeds(value)}>{value===0?"همه":value===4?"۴+":value.toLocaleString("fa-IR")}</button>)}</div>
          <button className="primary-action" onPointerUp={(event) => { event.preventDefault(); event.stopPropagation(); }} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setMaxPrice(draftMaxPrice);setMinBeds(draftBeds);setFilterOpen(false); }}>اعمال فیلتر و نمایش فایل‌ها</button>
        </div>
      </BottomSheet>
    </>
  );
}

function DetailScreen({ property, favorite, onFavorite, onBack, onRequireLogin }: {
  property: Property;
  favorite: boolean;
  onFavorite: () => void;
  onBack: () => void;
  onRequireLogin: () => void;
}) {
  type DetailMedia={key:string;url:string;name:string;type:string;size:number};
  type Advisor={id:string;name:string;mobile:string};
  const [detail,setDetail]=useState<any>(null),[media,setMedia]=useState<DetailMedia[]>([]),[advisor,setAdvisor]=useState<Advisor|null>(null),[activeMedia,setActiveMedia]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const [requestType,setRequestType]=useState<"visit"|"consultation"|null>(null),[scheduledAt,setScheduledAt]=useState(()=>new Date(Date.now()+86400000).toISOString().slice(0,16)),[notes,setNotes]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
  useEffect(()=>{const controller=new AbortController();setLoading(true);setError("");fetch(`/api/properties/${encodeURIComponent(String(property.id))}`,{signal:controller.signal,cache:"no-store"}).then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error);setDetail(body.item);setMedia(body.media||[]);setAdvisor(body.advisor||null);setActiveMedia(0)}).catch(()=>{if(!controller.signal.aborted)setError("دریافت جزئیات ملک انجام نشد.")}).finally(()=>setLoading(false));return()=>controller.abort()},[property.id]);
  let details:any={};try{details=JSON.parse(detail?.description||property.description||"{}")}catch{details={description:detail?.description||property.description||""}};
  const gallery=media.length?media:[{key:"cover",url:detail?.coverImage||property.image,name:property.title,type:"image/webp",size:0}],current=gallery[Math.min(activeMedia,gallery.length-1)];
  const amenities=Array.isArray(details.amenities)?details.amenities:property.amenities||[];
  const title=detail?.title||property.title,address=detail?.address||property.area,area=Number(detail?.area||property.size),beds=Number(detail?.bedrooms||property.beds),price=Number(detail?.price||property.amount||0),buildingYear=details.buildYear||details.buildingYear||details.age||property.buildingYear;
  const requireLogin=(response:Response)=>{if(response.status===401){onRequireLogin();return true}return false};
  const submitRequest=async()=>{if(!requestType)return;setBusy(true);setNotice("");try{const endpoint=requestType==="visit"?"/api/visits":"/api/consultations",body=requestType==="visit"?{propertyId:String(property.id),scheduledAt:new Date(scheduledAt).toISOString()}:{propertyId:String(property.id),scheduledAt:new Date(scheduledAt).toISOString(),subject:`مشاوره درباره ${title}`,notes};const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});if(requireLogin(response))return;if(!response.ok)throw new Error();setRequestType(null);setNotes("");setNotice(requestType==="visit"?"درخواست بازدید ثبت شد و در پنل قابل پیگیری است.":"درخواست مشاوره و گفت‌وگو ثبت شد.")}catch{setNotice("ثبت درخواست انجام نشد؛ زمان و اطلاعات را بررسی کنید.")}finally{setBusy(false)}};
  const startChat=async()=>{if(!advisor)return setNotice("هنوز مشاور مشخصی برای این ملک تعیین نشده است.");setBusy(true);try{const response=await fetch("/api/chat",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"create",participantAccountIds:[advisor.id],kind:"property",propertyId:String(property.id),subject:`گفت‌وگو درباره ${title}`})}),body=await response.json();if(requireLogin(response))return;if(!response.ok)throw new Error();window.location.href=`/panel?chat=${encodeURIComponent(body.id)}`}catch{setNotice("ایجاد گفت‌وگو انجام نشد.")}finally{setBusy(false)}};
  const share=async()=>{try{if(navigator.share)await navigator.share({title,text:address,url:location.href});else{await navigator.clipboard.writeText(location.href);setNotice("لینک ملک کپی شد.")}}catch{}}
  return (
    <MobileScroll key="detail" className="app-screen detail-scroll">
      <main className="detail-screen" dir="rtl">
        <div className="detail-hero">
          {current?.type.startsWith("video/")?<video src={current.url} controls playsInline/>:<img src={current?.url||property.image} alt={title} />}
          <button className="detail-back" onClick={onBack} aria-label="بازگشت"><ChevronLeftIcon /></button>
          <div className="detail-tools">
            <button onClick={share} aria-label="اشتراک"><Share2Icon /></button>
            <button onClick={onFavorite} aria-label="علاقه‌مندی">{favorite ? <HeartFilledIcon /> : <HeartIcon />}</button>
          </div>
          <span className="photo-count">{(activeMedia+1).toLocaleString("fa-IR")} / {gallery.length.toLocaleString("fa-IR")}</span>
        </div>
        <div className="detail-body">
          {gallery.length>1&&<div className="detail-media-strip">{gallery.map((item,index)=><button key={item.key} className={activeMedia===index?"active":""} onClick={()=>setActiveMedia(index)} aria-label={`رسانه ${index+1}`}>{item.type.startsWith("video/")?<video src={item.url} muted/>:<img src={item.url} alt=""/>}</button>)}</div>}
          {loading&&<p className="detail-state">در حال دریافت اطلاعات کامل ملک…</p>}{error&&<p className="detail-state error">{error}</p>}
          <span className="detail-badge">{property.badge}</span>
          <h1>{title}</h1>
          <p className="property-area"><DrawingPinIcon /> {address}</p>
          <strong className="detail-price">{price.toLocaleString("fa-IR")} تومان</strong>
          <span className="meter-price">متری {Math.round(price/Math.max(1,area)).toLocaleString("fa-IR")} تومان</span>
          <div className="feature-row">
            <div><HomeIcon /><strong>{area.toLocaleString("fa-IR",{useGrouping:false})}</strong><span>متر</span></div>
            <div><BookmarkIcon /><strong>{beds.toLocaleString("fa-IR",{useGrouping:false})}</strong><span>خواب</span></div>
            {buildingYear&&<div><CalendarIcon /><strong>{Number(buildingYear).toLocaleString("fa-IR",{useGrouping:false})}</strong><span>سال ساخت</span></div>}
            {amenities.map((item:string)=><div key={item}><CheckCircledIcon/><strong>دارد</strong><span>{item}</span></div>)}
          </div>
          <section className="description-card">
            <h2>توضیحات</h2>
            <p>{details.description||"اطلاعات تکمیلی این ملک پس از هماهنگی با مشاور ارائه می‌شود."}</p>
          </section>
          <section className="advisor-card">
            <img className="advisor-avatar" src="/assets/hatam/advisor.webp" alt="حاتم امیری، مشاور املاک" />
            <div><span>مشاور اختصاصی این فایل</span><strong>{advisor?.name||"تیم مشاوران حاتم"}</strong></div>
            <span className="online-dot" />
          </section>
          <div className="detail-actions">
            <button className="primary-action" onClick={()=>setRequestType("visit")}><CalendarIcon /> درخواست بازدید</button>
            <button disabled={!advisor?.mobile} onClick={()=>advisor?.mobile&&(location.href=`tel:${advisor.mobile}`)}><IdCardIcon /> تماس</button>
            <button disabled={busy} onClick={startChat}><ChatBubbleIcon /> چت</button>
          </div>
          <button className="detail-consultation" onClick={()=>setRequestType("consultation")}><ChatBubbleIcon/>درخواست مشاوره درباره این ملک</button>
          {notice&&<p className="detail-notice" role="status">{notice}</p>}
        </div>
        {requestType&&<div className="detail-request-backdrop" onMouseDown={()=>setRequestType(null)}><section role="dialog" aria-modal="true" aria-label={requestType==="visit"?"درخواست بازدید":"درخواست مشاوره"} onMouseDown={event=>event.stopPropagation()}><header><div><span>هماهنگی با حاتم</span><h2>{requestType==="visit"?"زمان پیشنهادی بازدید":"درخواست مشاوره"}</h2></div><button onClick={()=>setRequestType(null)} aria-label="بستن"><Cross2Icon/></button></header><label><span>تاریخ و ساعت پیشنهادی</span><input type="datetime-local" value={scheduledAt} min={new Date().toISOString().slice(0,16)} onChange={event=>setScheduledAt(event.target.value)}/></label>{requestType==="consultation"&&<label><span>توضیحات شما</span><textarea value={notes} maxLength={1000} onChange={event=>setNotes(event.target.value)} placeholder="سؤال، بودجه یا شرایط موردنظر را بنویسید…"/></label>}<footer><button onClick={()=>setRequestType(null)}>انصراف</button><button className="primary-action" disabled={busy} onClick={submitRequest}>{busy?"در حال ثبت…":"ثبت درخواست"}</button></footer></section></div>}
      </main>
    </MobileScroll>
  );
}

function FavoritesScreen({ favorites, onOpen, onFavorite }: { favorites: Array<string | number>; onOpen: (p: Property) => void; onFavorite: (id: string | number) => void }) {
  const {properties}=usePublishedProperties();
  const items = properties.filter((p) => favorites.includes(p.id));
  return <MobileScroll key="favorites" className="app-screen hatam-scroll"><main className="saved-screen" dir="rtl"><header className="plain-header"><h1>علاقه‌مندی‌ها</h1><p>فایل‌هایی که برای بررسی بعدی ذخیره کرده‌اید</p></header><div className="result-list">{items.map((p) => <PropertyCard key={p.id} property={p} onOpen={() => onOpen(p)} favorite onFavorite={() => onFavorite(p.id)} />)}{!items.length && <div className="empty-state"><HeartIcon /><strong>هنوز فایلی ذخیره نکرده‌اید</strong><span>با لمس قلب، فایل‌های دلخواه اینجا می‌آیند.</span></div>}</div></main></MobileScroll>;
}

function ProfileScreen() {
  return <MobileScroll key="profile" className="app-screen hatam-scroll"><main className="profile-screen" dir="rtl"><Brand /><div className="profile-avatar"><PersonIcon /></div><h1>سلام، حاتم</h1><p>مدیریت درخواست‌ها و فایل‌های ذخیره‌شده</p><button className="primary-action" onClick={()=>window.location.href="/login"}>ورود یا ثبت‌نام با موبایل</button><div className="profile-stats"><div><strong>۱۲</strong><span>بازدیدها</span></div><div><strong>۳</strong><span>درخواست‌ها</span></div><div><strong>۲</strong><span>مشاورها</span></div></div><div className="profile-menu"><button><CalendarIcon /><span>درخواست‌های بازدید</span><ChevronLeftIcon /></button><button><BookmarkFilledIcon /><span>فایل‌های ذخیره‌شده</span><ChevronLeftIcon /></button><button><ChatBubbleIcon /><span>گفت‌وگوها</span><ChevronLeftIcon /></button></div></main></MobileScroll>;
}

const appMapIcons={neshan:DrawingPinIcon,google:GlobeIcon,balad:DrawingPinIcon};
const appSocialIcons={bale:EnvelopeClosedIcon,whatsapp:ChatBubbleIcon,instagram:CameraIcon,telegram:PaperPlaneIcon};
function AppContactScreen({onBack}:{onBack:()=>void}){const [config,setConfig]=useState<ContactConfig>(defaultContactConfig);useEffect(()=>{fetch("/api/contact").then(r=>r.json()).then(data=>data.config&&setConfig(data.config)).catch(()=>{})},[]);const tel=(value:string)=>value.replace(/[^\d+]/g,"");return <MobileScroll key="contact" className="app-screen hatam-scroll app-contact-scroll"><main className="contact-page contact-page-in-app" dir="rtl"><header className="contact-topbar"><button onClick={onBack} aria-label="بازگشت"><ChevronLeftIcon/></button><strong>{config.title}</strong><Brand/></header><section className="contact-card"><div className="contact-heading"><span>در کنار شما</span><h1>{config.title}</h1><p>{config.intro}</p></div><div className="contact-address"><DrawingPinIcon/><div><strong>{config.addressLabel}:</strong><p>{config.address}</p></div></div><div className="contact-map-links">{config.maps.filter(x=>x.enabled&&x.url).map(item=>{const Icon=appMapIcons[item.id as keyof typeof appMapIcons]||DrawingPinIcon;return <a key={item.id} href={item.url} target="_blank" rel="noreferrer"><Icon/><span>{item.label}</span><ExternalLinkIcon/></a>})}</div><div className="contact-divider"/><section className="contact-phones"><h2>شماره تماس</h2>{config.phones.map(phone=><a key={phone} href={`tel:${tel(phone)}`} dir="ltr"><MobileIcon/><span>{phone}</span></a>)}</section><div className="contact-divider"/><section className="contact-social"><h2>شبکه‌های اجتماعی</h2><div>{config.socials.filter(x=>x.enabled&&x.url).map(item=>{const Icon=appSocialIcons[item.id as keyof typeof appSocialIcons]||GlobeIcon;return <a key={item.id} href={item.url} target="_blank" rel="noreferrer"><Icon/><span>{item.label}</span></a>})}</div></section></section><p className="contact-signature">مسیر روشن، کار جمع</p></main></MobileScroll>}

function CooperateScreen({onAction}:{onAction:(action:CooperateMethod["action"],target?:string)=>void}){const [open,setOpen]=useState("buy"),[config,setConfig]=useState<CooperateConfig>(defaultCooperateConfig);useEffect(()=>{fetch("/api/cooperate").then(r=>r.json()).then(x=>x.config&&setConfig(x.config)).catch(()=>{})},[]);return <MobileScroll key="cooperate" className="app-screen hatam-scroll cooperate-scroll"><main className="cooperate-page" dir="rtl"><section className="cooperate-hero"><span>{config.eyebrow}</span><h1>{config.title}</h1><div className="cooperate-intro"><strong>{config.introTitle}</strong><p>{config.intro}</p></div></section><section className="cooperate-methods" aria-label="روش‌های همکاری">{config.methods.filter(x=>x.enabled).map((method,index)=><article key={method.id} className={`cooperate-accordion ${open===method.id?"open":""}`}><button aria-expanded={open===method.id} onClick={()=>setOpen(open===method.id?"":method.id)}><span className="cooperate-method-icon">{index===0?<HomeIcon/>:index===1?<PlusCircledIcon/>:<IdCardIcon/>}</span><span><small>روش {(index+1).toLocaleString("fa-IR")} همکاری</small><strong>{method.title}</strong></span><ChevronLeftIcon/></button>{open===method.id&&<div className="cooperate-panel"><p>{method.text}</p><button className="cooperate-consultants" onClick={()=>onAction(method.action,method.target)}><PlusCircledIcon/><span>{method.buttonLabel}</span><ChevronLeftIcon/></button></div>}</article>)}</section><p className="cooperate-signature">مسیر روشن، کار جمع</p></main></MobileScroll>}

function CooperateFormScreen({onDone}:{onDone:()=>void}){const successDefault="متشکرم، کارشناسان ما در سریع‌ترین زمان با شما تماس خواهند گرفت و تایم مصاحبه را به شما اعلام می‌کنند.";const [config,setConfig]=useState(defaultCooperateConfig),[form,setForm]=useState<Record<string,string>>({}),[hasExperience,setHasExperience]=useState(false),[notice,setNotice]=useState(""),[success,setSuccess]=useState(false),[saving,setSaving]=useState(false);useEffect(()=>{fetch("/api/cooperate").then(r=>r.json()).then(x=>x.config&&setConfig(x.config)).catch(()=>{})},[]);const fields=config.fields.filter(x=>x.enabled),base=fields.filter(x=>["firstName","lastName","age"].includes(x.id)),experience=fields.filter(x=>!["firstName","lastName","age"].includes(x.id));const submit=async()=>{if(base.some(x=>x.required&&!form[x.id]?.trim())||(hasExperience&&experience.some(x=>x.required&&!form[x.id]?.trim()))){setSuccess(false);setNotice("لطفاً همه فیلدهای ضروری را کامل کنید.");return}setSaving(true);try{const r=await fetch("/api/cooperate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...form,hasExperience,areas:form.areas||""})});if(!r.ok)throw new Error();setSuccess(true);setNotice(config.successMessage||successDefault)}catch{setSuccess(false);setNotice("ثبت اطلاعات انجام نشد؛ دوباره تلاش کنید.")}finally{setSaving(false)}};return <MobileScroll key="cooperate-form" className="app-screen hatam-scroll cooperate-scroll"><main className="cooperate-page cooperate-form" dir="rtl"><section className="cooperate-hero"><span>درخواست همکاری</span><h1>{config.formTitle}</h1></section><section className="cooperate-form-card"><h2>مشخصات شما</h2><div className="cooperate-form-grid">{base.map(field=><label key={field.id}><span>{field.label}{field.required?" *":""}</span><input inputMode={field.type==="number"?"numeric":"text"} value={form[field.id]||""} onChange={e=>setForm({...form,[field.id]:field.type==="number"?numericInput(e.target.value):e.target.value})}/></label>)}</div></section><section className="cooperate-form-card"><h2>تجربه و سابقه</h2><p>{config.experienceQuestion}</p><div className="experience-toggle" role="radiogroup" aria-label="سابقه فعالیت"><button role="radio" aria-checked={!hasExperience} className={!hasExperience?"active":""} onClick={()=>setHasExperience(false)}><i/>ندارم</button><button role="radio" aria-checked={hasExperience} className={hasExperience?"active":""} onClick={()=>setHasExperience(true)}><i/>دارم</button></div>{hasExperience&&<div className="experience-details"><div className="cooperate-form-grid experience-fields">{experience.map(field=><label key={field.id}><span>{field.label}{field.required?" *":""}</span><input value={form[field.id]||""} onChange={e=>setForm({...form,[field.id]:e.target.value})}/></label>)}</div></div>}</section>{notice&&<div className={`cooperate-form-notice ${success?"success":""}`} role="status">{success&&<CheckCircledIcon/>}<p>{notice}</p>{success&&<button onClick={onDone}>بازگشت به همکاری با ما</button>}</div>}<button className="cooperate-form-submit" disabled={saving||success} onClick={submit}>{saving?"در حال ثبت...":"ثبت مشخصات"}</button></main></MobileScroll>}

type LoginRole="user"|"consultant"|"agency";
function AppLoginScreen({initialRole,initialMode,onDone}:{initialRole:LoginRole;initialMode:"login"|"register";onDone:()=>void}){const [role,setRole]=useState<LoginRole>(initialRole),[mode,setMode]=useState(initialMode),[mobile,setMobile]=useState(""),[challenge,setChallenge]=useState(""),[code,setCode]=useState(""),[developmentCode,setDevelopmentCode]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");const request=async()=>{setBusy(true);setMessage("");try{const r=await fetch("/api/auth/request-otp",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mobile,role,mode})}),data=await r.json();if(!r.ok)throw new Error(data.error||"REQUEST_FAILED");setChallenge(data.challengeId);setDevelopmentCode(data.developmentCode||"");setMessage("کد یک‌بارمصرف ارسال شد.")}catch(e){setMessage(e instanceof Error&&e.message==="RATE_LIMITED"?"لطفاً یک دقیقه دیگر دوباره تلاش کنید.":"ارسال کد انجام نشد؛ شماره را بررسی کنید.")}finally{setBusy(false)}};const verify=async()=>{setBusy(true);setMessage("");try{const r=await fetch("/api/auth/verify-otp",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({challengeId:challenge,mobile,role,mode,code})}),data=await r.json();if(!r.ok)throw new Error(data.error||"VERIFY_FAILED");if(data.destination)window.location.href=data.destination;else{setMessage("ثبت‌نام انجام شد و حساب شما در انتظار تأیید مدیر است.");window.setTimeout(onDone,1800)}}catch{setMessage("کد واردشده معتبر نیست یا منقضی شده است.")}finally{setBusy(false)}};const labels={user:"خریدار و فروشنده",consultant:"مشاور املاک",agency:"آژانس املاک"};return <MobileScroll key="login" className="app-screen hatam-scroll app-login-scroll"><main className="app-login-page" dir="rtl"><section className="app-login-card"><div className="app-login-mark"><LockClosedIcon/></div><span>ورود امن به حاتم</span><h1>{mode==="login"?"ورود به حساب کاربری":"ساخت حساب جدید"}</h1><p>نقش حساب را انتخاب کنید و شماره موبایل خودتان را وارد کنید.</p><div className="app-login-roles">{(Object.keys(labels) as LoginRole[]).map(value=><button key={value} className={role===value?"active":""} onClick={()=>{setRole(value);setChallenge("")}}>{labels[value]}</button>)}</div>{!challenge?<label className="app-login-field"><span>شماره موبایل</span><input dir="ltr" inputMode="tel" value={mobile} onChange={e=>setMobile(mobileInput(e.target.value))} placeholder="09120000000"/></label>:<label className="app-login-field"><span>کد یک‌بارمصرف</span><input dir="ltr" inputMode="numeric" maxLength={4} value={code} onChange={e=>setCode(numericInput(e.target.value))} placeholder="— — — —"/>{developmentCode&&<small>کد آزمایشی محلی: {developmentCode}</small>}</label>}<button className="app-login-submit" disabled={busy||(!challenge?mobile.length<11:code.length!==4)} onClick={challenge?verify:request}>{busy?"لطفاً صبر کنید...":challenge?"تأیید و ادامه":"دریافت کد ورود"}</button>{challenge&&<button className="app-login-change" onClick={()=>{setChallenge("");setCode("")}}>تغییر شماره موبایل</button>}{message&&<p className="app-login-message" role="status">{message}</p>}<button className="app-login-mode" onClick={()=>{setMode(mode==="login"?"register":"login");setChallenge("")}}>{mode==="login"?"حساب ندارید؟ ثبت‌نام کنید":"حساب دارید؟ وارد شوید"}</button></section><AppPasswordLogin/></main></MobileScroll>}

function SubmitChoiceScreen({onBack,onOwner,onConsultant}:{onBack:()=>void;onOwner:()=>void;onConsultant:()=>void}) {
  return <MobileScroll key="submit-choice" className="app-screen hatam-scroll submit-choice-scroll"><main className="submit-choice-page" dir="rtl">
    <header className="submit-topbar"><button onClick={onBack} aria-label="بازگشت"><ChevronLeftIcon/></button><Brand/><button aria-label="منو"><HamburgerMenuIcon/></button></header>
    <section className="submit-choice-card"><span>ثبت ملک در حاتم</span><h1>نوع کاربری خود را انتخاب کنید</h1><p>مسیر ثبت ملک متناسب با نقش شما نمایش داده می‌شود.</p>
      <button className="role-choice primary" onClick={onOwner}><HomeIcon/><span><strong>فروشنده / مالک هستم</strong><small>ثبت سریع درخواست فروش ملک</small></span><ChevronLeftIcon/></button>
      <button className="role-choice" onClick={onConsultant}><IdCardIcon/><span><strong>مشاور املاک هستم</strong><small>ثبت فایل حرفه‌ای و ارسال برای تأیید</small></span><ChevronLeftIcon/></button>
    </section>
    <section className="submit-brand-copy"><Brand/><h2>املاک بزرگ حاتم</h2><p>خرید و فروش تخصصی املاک و مستغلات در شرق تهران</p><strong>مسیر روشنِ کار جمع</strong></section>
  </main></MobileScroll>
}

function ConsultantSubmitScreen({onBack,onDone,dark,toggleTheme}:{onBack:()=>void;onDone:()=>void;dark:boolean;toggleTheme:()=>void}) {
  const [config,setConfig]=useState<FilterConfig>(defaultFilterConfig);
  const [form,setForm]=useState<Record<string,string>>({name:"",office:"",region:"",neighborhood:"",area:"",bedrooms:"",age:"",floor:"",floors:"",units:"",facade:"سنگ",passage:"",deposit:"",rent:"",vacateDate:"",internalPrice:"",publicPrice:""});
  const [amenities,setAmenities]=useState<string[]>([]),[deeds,setDeeds]=useState<string[]>([]),[occupancy,setOccupancy]=useState("تخلیه"),[media,setMedia]=useState<PropertyMedia[]>([]),[error,setError]=useState(""),[success,setSuccess]=useState(false),[saving,setSaving]=useState(false);
  const [latitude,setLatitude]=useState<number|null>(null),[longitude,setLongitude]=useState<number|null>(null),[locationMode,setLocationMode]=useState<"point"|"area">("point"),[locationRadius,setLocationRadius]=useState(300);
  const set=(key:string,value:string)=>setForm(current=>({...current,[key]:value}));
  const money=(key:string,value:string)=>set(key,numericInput(value));
  const toggle=(value:string,list:string[],setter:(next:string[])=>void)=>setter(list.includes(value)?list.filter(item=>item!==value):[...list,value]);
  useEffect(()=>{fetchFilterConfig().then(setConfig)},[]);
  const submit=async()=>{setError("");if(!form.name.trim()||!form.office.trim()||!form.region||!form.neighborhood||!form.area||!form.publicPrice||latitude==null||longitude==null){setError("نام، دفتر، موقعیت نقشه، متراژ و قیمت نمایش را کامل کنید.");return}setSaving(true);try{const response=await fetch("/api/properties",{method:"POST",headers:{"content-type":"application/json","x-hatam-preview-role":"consultant"},body:JSON.stringify({title:`فایل ${form.area} متری ${form.neighborhood}`,address:`منطقه ${form.region}، ${form.neighborhood}`,district:form.region,latitude,longitude,transactionType:"sale",propertyType:"apartment",area:Number(form.area),bedrooms:Number(form.bedrooms||0),price:Number(form.publicPrice),description:JSON.stringify({...form,amenities,deeds,occupancy,locationMode,locationRadius,media:media.map(item=>({name:item.name,type:item.type}))}),mediaKeys:media.map(item=>item.key),submitForReview:true})});if(!response.ok)throw new Error();setSuccess(true)}catch{setError("ثبت آنلاین انجام نشد. اتصال سرویس را بررسی کنید.")}finally{setSaving(false)}};
  const numericFields:[[string,string],[string,string],[string,string],[string,string],[string,string],[string,string]]=[["area","متراژ *"],["bedrooms","تعداد خواب"],["age","سن بنا"],["floor","طبقه"],["floors","کل طبقات"],["units","واحد در طبقه"]];
  return <MobileScroll key="consultant-submit" className="app-screen hatam-scroll consultant-submit-scroll"><main className="consultant-submit-page" dir="rtl">
    <header className="consultant-submit-header"><button onClick={onBack} aria-label="بازگشت"><ChevronLeftIcon/></button><Brand/><div><button aria-label="اعلان‌ها"><BellIcon/></button><button onClick={toggleTheme} aria-label="تغییر پوسته">{dark?<SunIcon/>:<MoonIcon/>}</button><button aria-label="منو"><HamburgerMenuIcon/></button></div></header>
    <div className="consultant-submit-title"><span>ثبت فایل حرفه‌ای</span><h1>مشخصات ملک را کامل کنید</h1><p>فایل پس از بررسی مدیر و تأیید اطلاعات منتشر می‌شود.</p></div>
    <section className="submit-form-card"><h2>اطلاعات مشاور</h2><div className="submit-grid two"><Field label="نام و نام خانوادگی *" value={form.name} onChange={v=>set("name",v)}/><Field label="نام دفتر املاک *" value={form.office} onChange={v=>set("office",v)}/></div></section>
    <section className="submit-form-card"><h2>عکس و فیلم ملک</h2><PropertyMediaUploader role="consultant" value={media} onChange={setMedia}/></section>
    <section className="submit-form-card"><h2>موقعیت ملک</h2><div className="submit-grid two"><label><span>منطقه *</span><select value={form.region} onChange={e=>{set("region",e.target.value);set("neighborhood","")}}><option value="">انتخاب کنید</option>{config.regions.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label><label><span>محله *</span><select value={form.neighborhood} disabled={!form.region} onChange={e=>set("neighborhood",e.target.value)}><option value="">انتخاب کنید</option>{(config.regions.find(v=>v.id===form.region)?.neighborhoods||[]).map(v=><option key={v}>{v}</option>)}</select></label></div><MapLocationPicker compact latitude={latitude} longitude={longitude} locationMode={locationMode} radius={locationRadius} onModeChange={setLocationMode} onRadiusChange={setLocationRadius} onChange={(lat,lng)=>{setLatitude(lat);setLongitude(lng)}}/></section>
    <section className="submit-form-card"><h2>مشخصات ملک</h2><div className="submit-grid three">{numericFields.map(([key,label])=><Field key={key} label={label} value={form[key]} numeric onChange={v=>set(key,v)}/>)}</div><div className="submit-grid two"><label><span>نمای ساختمان</span><select value={form.facade} onChange={e=>set("facade",e.target.value)}>{config.facades.map(v=><option key={v}>{v}</option>)}</select></label><Field label="گذر کوچه یا خیابان" value={form.passage} onChange={v=>set("passage",v)}/></div></section>
    <ToggleSection title="امکانات" values={config.amenities} selected={amenities} onToggle={v=>toggle(v,amenities,setAmenities)}/><ToggleSection title="نوع سند" values={config.deedTypes} selected={deeds} onToggle={v=>toggle(v,deeds,setDeeds)}/>
    <section className="submit-form-card"><h2>وضعیت سکونت</h2><div className="submit-toggle-grid">{config.occupancyTypes.map(v=><button className={occupancy===v?"active":""} key={v} onClick={()=>setOccupancy(v)}><span>{v}</span><i/></button>)}</div>{occupancy==="مستأجر"&&<div className="tenant-fields submit-grid"><MoneyField label="پول پیش / رهن" value={form.deposit} onChange={v=>money("deposit",v)}/><MoneyField label="کرایه / اجاره" value={form.rent} onChange={v=>money("rent",v)}/><Field label="تاریخ تخلیه (شمسی)" value={form.vacateDate} placeholder="۱۴۰۵/۰۷/۱۵" onChange={v=>set("vacateDate",v)}/></div>}</section>
    <section className="submit-form-card price-card"><h2>قیمت مدنظر</h2><MoneyField label="قیمت اصلی / کد داخلی" value={form.internalPrice} onChange={v=>money("internalPrice",v)}/><MoneyField label="قیمت قابل نمایش به مشتری *" value={form.publicPrice} onChange={v=>money("publicPrice",v)}/></section>
    {error&&<p className="consultant-submit-error">{error}</p>}<button className="publish-property" disabled={saving} onClick={submit}>{saving?"در حال ارسال...":"ارسال برای بررسی و انتشار"}</button>
    {success&&<div className="success-backdrop"><div className="success-popup"><CheckCircledIcon/><h2>فایل با موفقیت ثبت شد</h2><p>آگهی شما در صف بررسی مدیر قرار گرفت و پس از تأیید منتشر می‌شود.</p><button onClick={onDone}>بازگشت به صفحه اصلی</button></div></div>}
  </main></MobileScroll>
}

function Field({label,value,onChange,numeric,placeholder}:{label:string;value:string;onChange:(v:string)=>void;numeric?:boolean;placeholder?:string}){return <label><span>{label}</span><input inputMode={numeric?"numeric":undefined} value={value} placeholder={placeholder} onChange={e=>onChange(numeric?numericInput(e.target.value):e.target.value)}/></label>}
function MoneyField({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label><span>{label}</span><div className="money-control"><input inputMode="numeric" value={value?Number(value).toLocaleString("fa-IR"):""} onChange={e=>onChange(e.target.value)}/><small>تومان</small></div></label>}
function ToggleSection({title,values,selected,onToggle}:{title:string;values:string[];selected:string[];onToggle:(value:string)=>void}){return <section className="submit-form-card"><h2>{title}</h2><div className="submit-toggle-grid">{values.map(value=><button type="button" className={selected.includes(value)?"active":""} key={value} onClick={()=>onToggle(value)}><span>{value}</span><i/></button>)}</div></section>}

type AiMessage={role:"assistant"|"user";content:string};
type AiMatch={id:string;title:string;address:string;district:string|null;area:number;bedrooms:number;price:number;coverImage:string|null};
function AiChatScreen({onBack,onShowFiles}:{onBack:()=>void;onShowFiles:()=>void}){
  const [messages,setMessages]=useState<AiMessage[]>([{role:"assistant",content:"من اینجام تا بهترین گزینه را متناسب با بودجه و سلیقه‌تان پیدا کنم. چه ملکی می‌خواهید؟"}]),[input,setInput]=useState(""),[loading,setLoading]=useState(false),[matches,setMatches]=useState<AiMatch[]>([]),[listening,setListening]=useState(false);
  const send=async()=>{const message=input.trim();if(!message||loading)return;const history=messages.slice(-8);setMessages(current=>[...current,{role:"user",content:message}]);setInput("");setLoading(true);try{const response=await fetch("/api/ai-assistant",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message,history})}),result=await response.json();setMessages(current=>[...current,{role:"assistant",content:result.reply||result.message||"پاسخی دریافت نشد؛ دوباره تلاش کنید."}]);if(result.matches)setMatches(result.matches)}catch{setMessages(current=>[...current,{role:"assistant",content:"ارتباط برقرار نشد. چند لحظه دیگر دوباره تلاش کنید."}])}finally{setLoading(false)}};
  const listen=()=>{const Speech=(window as unknown as {webkitSpeechRecognition?:new()=>{lang:string;interimResults:boolean;onresult:(event:{results:ArrayLike<{0:{transcript:string}}>} )=>void;onend:()=>void;start:()=>void}}).webkitSpeechRecognition;if(!Speech){setMessages(current=>[...current,{role:"assistant",content:"ورودی صوتی در این مرورگر پشتیبانی نمی‌شود؛ لطفاً درخواستتان را بنویسید."}]);return}const recognition=new Speech();recognition.lang="fa-IR";recognition.interimResults=false;recognition.onresult=event=>setInput(event.results[0][0].transcript);recognition.onend=()=>setListening(false);setListening(true);recognition.start()};
  return <main className="ai-chat-page" dir="rtl"><header><button onClick={onBack} aria-label="بازگشت"><ChevronLeftIcon/></button><div><span>دستیار هوشمند</span><strong>حاتم</strong></div><i/></header><section className="ai-chat-body"><div className="ai-orb" aria-hidden="true"><span>AI</span><StarIcon/><StarIcon/><StarIcon/></div><p className="ai-online"><i/> آنلاین و آماده جست‌وجو</p><div className="ai-thread">{messages.map((message,index)=><div key={`${message.role}-${index}`} className={`ai-bubble ${message.role}`}>{message.content}</div>)}{loading&&<div className="ai-bubble assistant ai-typing"><i/><i/><i/><span>در حال جست‌وجوی فایل‌ها</span></div>}</div>{matches.length>0&&<section className="ai-matches"><header><strong>نزدیک‌ترین فایل‌ها</strong><span>{matches.length} پیشنهاد</span></header>{matches.map(item=><article key={item.id}>{item.coverImage?<img src={item.coverImage} alt=""/>:<div className="ai-match-placeholder"><HomeIcon/></div>}<div><strong>{item.title}</strong><span>{item.district||item.address}</span><small>{item.area.toLocaleString("fa-IR")} متر · {item.bedrooms.toLocaleString("fa-IR")} خواب</small></div><b>{item.price.toLocaleString("fa-IR")} تومان</b></article>)}<button onClick={onShowFiles}>مشاهده همه فایل‌ها</button></section>}</section><form className="ai-composer" onSubmit={event=>{event.preventDefault();send()}}><button type="button" className={listening?"listening":""} onClick={listen} aria-label="ورودی صوتی"><SpeakerLoudIcon/></button><input value={input} onChange={event=>setInput(event.target.value)} placeholder="پیام خود را بنویسید..." aria-label="پیام شما"/><button type="submit" disabled={!input.trim()||loading} aria-label="ارسال"><PaperPlaneIcon/></button></form></main>
}

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (screen: Screen) => void }) {
  const keyboard = useKeyboard();
  const items = [
    { id: "favorites" as Screen, label: "علاقه‌مندی‌ها", Icon: HeartIcon, action:()=>setScreen("favorites") },
    { id: "search" as Screen, label: "نقشه", Icon: DrawingPinIcon, action:()=>setScreen("search") },
    { id: "submit-choice" as Screen, label: "ثبت ملک", Icon: Crosshair2Icon, action:()=>setScreen("submit-choice") },
    { id: "consultants" as Screen, label: "مشاورین", Icon: IdCardIcon, action:()=>setScreen("consultants") },
    { id: "login" as Screen, label: "ورود", Icon: PersonIcon, action:()=>setScreen("login") },
  ];
  return <nav className="bottom-nav" dir="rtl" aria-label="ناوبری اصلی">{items.map(({ id, label, Icon, action },index) => <button key={`${label}-${index}`} className={screen === id && id!=="home" ? "active" : ""} onPointerDown={(event) => event.preventDefault()} onClick={(event) => { event.preventDefault(); event.stopPropagation(); keyboard.hide(); window.setTimeout(() => { action(); resetDeviceScroll(); keyboard.hide(); }, 100); }}><Icon /><span>{label}</span></button>)}</nav>;
}

function AppSharedHeader({screen,setScreen,dark,toggleTheme}:{screen:Screen;setScreen:(screen:Screen)=>void;dark:boolean;toggleTheme:()=>void}){const [open,setOpen]=useState(false),[items,setItems]=useState<AppMenuItem[]>(defaultAppMenuItems);useEffect(()=>{fetch("/api/app-menu",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then(data=>setItems((data.items||defaultAppMenuItems).filter((x:AppMenuItem)=>x.enabled).sort((a:AppMenuItem,b:AppMenuItem)=>a.sortOrder-b.sortOrder))).catch(()=>setItems(defaultAppMenuItems))},[]);const icons:Record<string,typeof HomeIcon>={home:HomeIcon,heart:HeartIcon,rocket:RocketIcon,person:PersonIcon,bookmark:BookmarkFilledIcon,consultant:IdCardIcon,contact:EnvelopeClosedIcon,plus:PlusCircledIcon,login:PersonIcon};const run=(item:AppMenuItem)=>{setOpen(false);if(item.action==="home")setScreen("home");else if(item.action==="urgent"||item.action==="register-property")setScreen(item.action==="urgent"?"urgent":"submit-choice");else if(item.action==="featured")setScreen("home");else if(item.action==="trust"||(item.action==="url"&&item.target==="/trust"))setScreen("trust");else if(item.action==="cooperate"||(item.action==="consultants"&&item.id==="cooperate"))setScreen("cooperate");else if(item.action==="consultants")setScreen("consultants");else if(item.action==="contact")setScreen("contact");else if(item.action==="login")setScreen("login");else if(item.action==="url"&&item.target)window.location.href=item.target};return <><header className="app-shared-header" dir="rtl"><button className="app-shared-back" disabled={screen==="home"} onClick={()=>setScreen("home")} aria-label="بازگشت"><ChevronLeftIcon/></button><Brand/><div><button onClick={toggleTheme} aria-label={dark?"فعال‌کردن حالت روشن":"فعال‌کردن حالت تیره"}>{dark?<SunIcon/>:<MoonIcon/>}</button><button onClick={()=>setOpen(true)} aria-label="بازکردن منو"><HamburgerMenuIcon/></button></div></header>{open&&<div className="app-menu-backdrop shared-menu" role="presentation" onMouseDown={()=>setOpen(false)}><aside className="app-menu-drawer" role="dialog" aria-modal="true" aria-label="منوی اپ حاتم" onMouseDown={e=>e.stopPropagation()}><header><Brand/><button onClick={()=>setOpen(false)} aria-label="بستن منو"><Cross2Icon/></button></header><nav>{items.filter(x=>x.variant==="item").map(item=>{const Icon=icons[item.icon]||HomeIcon;return <button key={item.id} onClick={()=>run(item)}><Icon/><span>{item.label}</span></button>})}</nav>{items.filter(x=>x.variant==="cta").map(item=>{const Icon=icons[item.icon]||PlusCircledIcon;return <button key={item.id} className="app-menu-urgent" onClick={()=>run(item)}><Icon/><span><strong>{item.label}</strong>{item.subtitle&&<small>{item.subtitle}</small>}</span></button>})}</aside></div>}</>}

export default function Prototype() {
  const {theme,setTheme}=useTheme();
  const [appliedFilters,setAppliedFilters]=useState<PropertyFilters>();
  const [screen, setScreen] = useState<Screen>("home");
  const [selected, setSelected] = useState<Property>(previewProperties[0]);
  const [favorites, setFavorites] = useState<Array<string | number>>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("manual");
  const dark=theme==="dark";
  const [urgentEntry,setUrgentEntry]=useState<"default"|"trust"|"cooperate">("default");
  const [loginRole,setLoginRole]=useState<LoginRole>("user"),[loginMode,setLoginMode]=useState<"login"|"register">("login");
  useEffect(()=>{document.documentElement.classList.add("hatam-app-active");return()=>document.documentElement.classList.remove("hatam-app-active")},[]);
  useEffect(()=>{fetch("/api/favorites",{cache:"no-store"}).then(response=>response.ok?response.json():{items:[]}).then(data=>setFavorites((data.items||[]).map((item:any)=>item.property.id))).catch(()=>{})},[]);
  useEffect(()=>{const params=new URLSearchParams(window.location.search),requested=params.get("screen");if(requested==="urgent"){setUrgentEntry(params.get("source")==="trust"?"trust":"default");setScreen("urgent")}else if(requested==="filter"){setFilterMode("manual");setScreen("filter")}else if(requested==="ai-chat"){setScreen("ai-chat")}else if(requested==="contact"){setScreen("contact")}else if(requested==="trust"){setScreen("trust")}else if(requested==="cooperate"){setScreen("cooperate")}else if(requested==="consultants"){setScreen("consultants")}else if(requested==="login"){setScreen("login")}},[]);
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
  const toggleFavorite = async(id: string | number) => {const propertyId=String(id),removing=favorites.map(String).includes(propertyId),response=await fetch(removing?`/api/favorites?propertyId=${encodeURIComponent(propertyId)}`:"/api/favorites",removing?{method:"DELETE"}:{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({propertyId})});if(response.status===401){setLoginRole("user");setLoginMode("login");setScreen("login");return}if(response.ok)setFavorites(current=>removing?current.filter(item=>String(item)!==propertyId):[...current,propertyId])};
  const openProperty = (property: Property) => { setSelected(property); setScreen("detail"); };
  return (
    <div className={`hatam-app ${dark?"theme-dark":"theme-light"}`}>
      {screen!=="entry"&&<AppSharedHeader screen={screen} setScreen={setScreen} dark={dark} toggleTheme={()=>setTheme(dark?"light":"dark")}/>}
      {screen === "entry" && <EntryScreen continueAsGuest={()=>setScreen("home")} openLogin={(role,mode)=>{setLoginRole(role);setLoginMode(mode);setScreen("login")}}/>}
      {screen === "home" && <HomeScreen filters={appliedFilters} onOpen={openProperty} favorites={favorites} onFavorite={toggleFavorite} goSearch={() => setScreen("search")} openAiChat={()=>setScreen("ai-chat")} openContact={()=>setScreen("contact")} openTrust={()=>setScreen("trust")} openCooperate={()=>setScreen("cooperate")} openConsultants={()=>setScreen("consultants")} openFilter={(mode)=>{setFilterMode(mode);setScreen("filter")}} openUrgent={()=>{setUrgentEntry("default");setScreen("urgent")}} dark={dark} toggleTheme={()=>setTheme(dark?"light":"dark")} />}
      {screen === "filter" && <FilterScreen mode={filterMode} onBack={()=>setScreen("home")} onApply={value=>{setAppliedFilters(value);setScreen("home")}}/>}
      {screen === "urgent" && <UrgentSaleScreen entry={urgentEntry} onBack={()=>setScreen(urgentEntry==="cooperate"?"cooperate":"home")} onDone={()=>setScreen("home")}/>}
      {screen === "submit-choice" && <SubmitChoiceScreen onBack={()=>setScreen("home")} onOwner={()=>{setUrgentEntry("default");setScreen("urgent")}} onConsultant={()=>setScreen("consultant-submit")}/>}
      {screen === "consultant-submit" && <ConsultantSubmitScreen onBack={()=>setScreen("submit-choice")} onDone={()=>setScreen("home")} dark={dark} toggleTheme={()=>setTheme(dark?"light":"dark")}/>}
      {screen === "search" && <SearchScreen onOpen={openProperty} favorites={favorites} onFavorite={toggleFavorite} filterOpen={filterOpen} setFilterOpen={setFilterOpen} />}
      {screen === "favorites" && <FavoritesScreen favorites={favorites} onOpen={openProperty} onFavorite={toggleFavorite} />}
      {screen === "profile" && <ProfileScreen />}
      {screen === "detail" && <DetailScreen property={selected} favorite={favorites.map(String).includes(String(selected.id))} onFavorite={() => {void toggleFavorite(selected.id)}} onBack={() => setScreen("home")} onRequireLogin={()=>{setLoginRole("user");setLoginMode("login");setScreen("login")}} />}
      {screen === "ai-chat" && <AiChatScreen onBack={()=>setScreen("home")} onShowFiles={()=>setScreen("search")}/>}
      {screen === "contact" && <AppContactScreen onBack={()=>setScreen("home")}/>}
      {screen === "trust" && <MobileScroll key="trust" className="app-screen hatam-scroll"><TrustExperience embedded onBack={()=>setScreen("home")} onSell={()=>{setUrgentEntry("trust");setScreen("urgent")}} onBuy={()=>{setFilterMode("manual");setScreen("filter")}}/></MobileScroll>}
      {screen === "cooperate" && <CooperateScreen onAction={(action,target)=>{if(action==="consultants")setScreen("consultants");else if(action==="sale-form"){setUrgentEntry("cooperate");setScreen("urgent")}else if(action==="cooperate-form")setScreen("cooperate-form");else if(action==="url"&&target)window.location.href=target}}/>}
      {screen === "cooperate-form" && <CooperateFormScreen onDone={()=>setScreen("cooperate")}/>}
      {screen === "consultants" && <MobileScroll key="consultants" className="app-screen hatam-scroll"><ConsultantDirectory inApp onBack={()=>setScreen("home")}/></MobileScroll>}
      {screen === "login" && <AppLoginScreen initialRole={loginRole} initialMode={loginMode} onDone={()=>setScreen("home")}/>}
      {screen !== "detail" && screen !== "entry" && screen !== "filter" && screen !== "urgent" && screen !== "submit-choice" && screen !== "consultant-submit" && screen !== "ai-chat" && <BottomNav screen={screen} setScreen={setScreen} />}
    </div>
  );
}
