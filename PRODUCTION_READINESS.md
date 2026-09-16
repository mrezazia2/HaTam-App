# آمادگی Production پروژه حاتم

## وضعیت فعلی

- Build تولید با `vinext build` موفق است.
- داده‌های اصلی، احراز هویت، مدیریت کاربران و ملک‌ها، گفتگو، اعلان، یادآوری، کیف پول، رسید کارت‌به‌کارت، تسویه و مدل اشتراک روی D1 پیاده‌سازی شده‌اند.
- پنل ادمین در `/admin` و صف مالی در `/admin/finance` در دسترس است.
- migrationهای D1 تا `0007_youthful_iron_fist.sql` باید روی محیط Production اعمال شوند.

## مواردی که برای اتصال Production لازم است

1. دامنه‌ها و DNS: `hatamestate.ir`، `app`، `consultant`، `agency` و در آینده `api`.
2. پایگاه داده D1 با Binding نام `DB` و اجرای تمام migrationها.
3. Secretهای محیط: `AUTH_SECRET`، `INTEGRATION_SECRET_KEY` و `AUTOMATION_SECRET`؛ هرکدام باید تصادفی، مستقل و حداقل ۳۲ بایت باشند.
4. سرویس پیامک: Base URL، توکن، خط ارسال و پترن‌ها از `/admin/integrations`.
5. درگاه پرداخت منتخب و مستندات قطعی Request/Verify آن، Merchant/Terminal/Secret و Callback عمومی HTTPS.
6. Object Storage خصوصی با Binding پیشنهادی `FILES` برای آپلود تصویر رسید و مدارک؛ نمایش فایل باید فقط با کنترل مالکیت/نقش انجام شود.
7. Cron برای فراخوانی امن `POST /api/system/process-communications` با Bearer `AUTOMATION_SECRET`، پیشنهاد: هر یک دقیقه.

## مرز فعلی و کار وابسته به سرویس بیرونی

- پرداخت آنلاین اکنون Payment Intent می‌سازد، اما Redirect و Verify عمداً تا انتخاب سرویس‌دهنده و دریافت مستندات/کلید واقعی فعال نشده است.
- خرید اشتراک با کیف پول عملیاتی است؛ خرید با درگاه پس از Verify موفق باید Payment Intent را `paid` و اشتراک مرتبط را `active` کند.
- فیلد URL رسید فعلاً موجود است، اما آپلود امن فایل تا ایجاد R2/Object Storage انجام نمی‌شود.
- ارسال SMS فقط پس از ورود تنظیمات واقعی سرویس‌دهنده و دسترسی شبکه Production انجام می‌شود.

## کنترل‌های قبل از انتشار

- تست OTP واقعی، محدودسازی نرخ درخواست و بررسی تحویل SMS.
- تست sandbox درگاه و سناریوهای callback تکراری، ناموفق و مبلغ مغایر.
- تست دسترسی نقش‌ها و جلوگیری از مشاهده رسید/گفتگوی دیگران.
- تهیه Backup، سیاست retention، لاگ خطا و مانیتورینگ.
- جایگزینی فایل اصلی `/public/assets/hatam/tehran-night.webp`؛ Build فعلاً نبودن آن را هشدار می‌دهد.
- تست بصری دسکتاپ و موبایل در همه مسیرهای اصلی.

## VPS یا Cloudflare

معماری فعلی برای Cloudflare Sites/Workers + D1 + R2 آماده شده و الزام فنی به VPS ندارد. اگر API مستقل روی `api.hatamestate.ir`، WebSocket اختصاصی، صف پردازش سنگین یا سرویس‌های self-hosted انتخاب شود، آن بخش به VPS/Container نیاز خواهد داشت.
