import Link from "next/link";
import {
  ArrowLeftIcon,
  CheckCircledIcon,
  DrawingPinIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  RulerSquareIcon,
} from "@radix-ui/react-icons";

const featured = [
  {
    title: "پنت‌هاوس مدرن فرمانیه",
    location: "فرمانیه، بلوار اندرزگو",
    price: "۳۲ میلیارد تومان",
    details: "۲۱۰ متر · ۴ خواب",
    image: "/assets/hatam/penthouse.png",
    badge: "VIP",
  },
  {
    title: "آپارتمان نورگیر زعفرانیه",
    location: "زعفرانیه، خیابان آصف",
    price: "۱۸.۸ میلیارد تومان",
    details: "۱۴۰ متر · ۳ خواب",
    image: "/assets/hatam/bright-apartment.png",
    badge: "فوری",
  },
  {
    title: "آپارتمان نوساز نیاوران",
    location: "نیاوران، خیابان پاسداران",
    price: "۱۲.۵ میلیارد تومان",
    details: "۱۲۵ متر · ۲ خواب",
    image: "/assets/hatam/luxury-living.png",
    badge: "ویژه",
  },
];

export default function PublicHome() {
  return (
    <main className="public-site" dir="rtl">
      <header className="site-header">
        <Link className="site-brand" href="/" aria-label="صفحه اصلی املاک حاتم">
          <img src="/assets/hatam/logo.png" alt="املاک حاتم" />
        </Link>
        <nav aria-label="ناوبری اصلی">
          <Link href="#properties">خرید ملک</Link>
          <Link href="#properties">رهن و اجاره</Link>
          <Link href="#services">خدمات حاتم</Link>
          <Link href="#about">درباره ما</Link>
        </nav>
        <div className="header-actions">
          <Link className="text-action" href="/app">ورود</Link>
          <Link className="gold-action" href="/app">ثبت درخواست ملک</Link>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="hero-kicker">انتخاب مطمئن در بازار املاک تهران</span>
          <h1>خانه‌ای که به سبک زندگی شما می‌آید.</h1>
          <p>فایل‌های تاییدشده، مشاوره اختصاصی و یک مسیر شفاف از جست‌وجو تا قرارداد.</p>

          <div className="property-search" role="search">
            <div className="deal-tabs" aria-label="نوع معامله">
              <button className="active">خرید</button>
              <button>رهن و اجاره</button>
              <button>پیش‌فروش</button>
            </div>
            <div className="search-fields">
              <label>
                <span>محدوده موردنظر</span>
                <strong><DrawingPinIcon /> تهران، منطقه یا محله</strong>
              </label>
              <label>
                <span>نوع ملک</span>
                <strong><HomeIcon /> آپارتمان</strong>
              </label>
              <label>
                <span>بازه قیمت</span>
                <strong><RulerSquareIcon /> انتخاب بودجه</strong>
              </label>
              <Link className="search-button" href="/app"><MagnifyingGlassIcon /> جست‌وجو</Link>
            </div>
          </div>
        </div>
        <div className="hero-proof">
          <span><strong>+۱۲۰۰</strong> فایل بررسی‌شده</span>
          <span><strong>+۸۵</strong> مشاور متخصص</span>
          <span><strong>۹۲٪</strong> رضایت مشتریان</span>
        </div>
      </section>

      <section className="featured-section" id="properties">
        <div className="section-title-row">
          <div>
            <span className="section-kicker">منتخب امروز</span>
            <h2>فایل‌های ویژه حاتم</h2>
          </div>
          <Link href="/app">مشاهده همه فایل‌ها <ArrowLeftIcon /></Link>
        </div>
        <div className="featured-grid">
          {featured.map((property) => (
            <article className="site-property-card" key={property.title}>
              <Link href="/app" aria-label={`مشاهده ${property.title}`} />
              <div className="site-card-media">
                <img src={property.image} alt={property.title} />
                <span>{property.badge}</span>
              </div>
              <div className="site-card-copy">
                <div>
                  <h3>{property.title}</h3>
                  <p><DrawingPinIcon /> {property.location}</p>
                </div>
                <div className="site-card-meta">
                  <span>{property.details}</span>
                  <strong>{property.price}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="service-section" id="services">
        <div className="service-copy">
          <span className="section-kicker">فراتر از نمایش آگهی</span>
          <h2>از انتخاب محله تا امضای قرارداد، کنار شما هستیم.</h2>
          <p>حاتم فایل‌ها را پیش از نمایش بررسی می‌کند، پیشنهادها را با نیاز واقعی شما تطبیق می‌دهد و ارتباط با مشاور را ساده و مستقیم نگه می‌دارد.</p>
          <ul>
            <li><CheckCircledIcon /> فایل‌های تایید هویت و بررسی‌شده</li>
            <li><CheckCircledIcon /> مشاور اختصاصی برای هر درخواست</li>
            <li><CheckCircledIcon /> برنامه‌ریزی بازدید و پیگیری یکپارچه</li>
          </ul>
          <Link className="outline-action" href="/app">شروع جست‌وجوی هوشمند <ArrowLeftIcon /></Link>
        </div>
        <div className="service-visual">
          <img src="/assets/hatam/bright-apartment.png" alt="فضای داخلی یک ملک منتخب حاتم" />
          <div className="service-note"><strong>انتخاب دقیق‌تر</strong><span>براساس بودجه، محله و سبک زندگی شما</span></div>
        </div>
      </section>

      <section className="app-promo" id="about">
        <div>
          <span className="section-kicker">همیشه در دسترس</span>
          <h2>تمام فایل‌ها و درخواست‌ها، داخل اپ حاتم</h2>
          <p>ملک ذخیره کنید، با مشاور گفت‌وگو کنید و زمان بازدیدها را در یک فضای شخصی مدیریت کنید.</p>
          <Link className="gold-action" href="/app">مشاهده وب‌اپ حاتم</Link>
        </div>
        <div className="app-mini-panel">
          <img src="/assets/hatam/logo.png" alt="حاتم" />
          <span>جست‌وجوی سریع</span>
          <strong>ملک مناسب شما نزدیک‌تر از چیزی‌ست که فکر می‌کنید.</strong>
          <div><MagnifyingGlassIcon /> محله، خیابان یا نوع ملک...</div>
        </div>
      </section>

      <footer className="site-footer">
        <img src="/assets/hatam/logo.png" alt="املاک حاتم" />
        <p>تجربه‌ای شفاف، حرفه‌ای و انسانی برای انتخاب ملک.</p>
        <div><Link href="/app">وب‌اپ کاربران</Link><Link href="/consultant">پنل مشاور</Link><Link href="/agency">پنل آژانس</Link></div>
        <span>© ۱۴۰۵ املاک حاتم</span>
      </footer>
    </main>
  );
}
