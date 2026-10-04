# معماری دامنه‌های HaTam

این پروژه یک کدبیس مشترک دارد و هر محصول در مسیر مستقل توسعه داده می‌شود. در محیط نهایی، دامنه‌ها باید به مسیر متناظر Rewrite شوند.

| دامنه | بخش | مسیر فعلی |
|---|---|---|
| `hatamestate.com` | سایت عمومی و صفحات SEO | `/` |
| `web.hatamestate.com` | وب‌اپ مرورگر | `/app` |
| `app.hatamestate.com` | اپ موبایل/PWA | `/app` |
| `admin.hatamestate.com` | پنل ادمین | `/admin` |
| `consultant.hatamestate.com` | پنل مشاوران | `/consultant` |
| `agency.hatamestate.com` | پنل آژانس‌های املاک | `/agency` |
| `panel.hatamestate.com` | پنل مشتری | `/panel` |

اپلیکیشن iOS و Android در فاز بعدی از همان API و Design System مشترک استفاده می‌کند. پیشنهاد نام API عمومی نیز `api.hatamestate.ir` است.

## نکات اتصال دامنه

- هر چهار دامنه باید HTTPS داشته باشند.
- نشست‌ها عمداً Host-only هستند؛ ورود هر پنل روی زیردامنه خودش انجام می‌شود و کوکی بین زیردامنه‌ها پخش نمی‌شود.
- سایت عمومی قابل ایندکس است؛ پنل‌ها و وب‌اپ از ایندکس موتورهای جست‌وجو خارج می‌شوند.
- برای استقرار روی Vercel یا Cloudflare، Host-based rewrite باید به مسیرهای جدول بالا متصل شود.
