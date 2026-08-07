# HaTam Estate

کدبیس سایت عمومی، وب‌اپ کاربران و پنل‌های املاک حاتم با طراحی RTL و هویت بصری سبز و طلایی.

## بخش‌های پروژه

| مسیر | کاربرد | دامنه نهایی پیشنهادی |
|---|---|---|
| `/` | سایت عمومی و صفحات قابل ایندکس | `hatamestate.ir` |
| `/panel` | پنل شخصی کاربران | `app.hatamestate.ir/panel` |
| `/app` | وب‌اپ کاربران | `app.hatamestate.ir` |
| `/consultant` | پنل مشاور املاک | `consultant.hatamestate.ir` |
| `/agency` | پنل آژانس املاک | `agency.hatamestate.ir` |

جزئیات اتصال دامنه‌ها در [DOMAIN_ARCHITECTURE.md](./DOMAIN_ARCHITECTURE.md) نوشته شده است.

## اجرای محلی

پیش‌نیاز: Node.js نسخه `22.13` یا جدیدتر.

```bash
npm ci
npm run dev
```

برای بررسی نسخه تولید:

```bash
npm run build
```

## فناوری‌ها

- Next.js / Vinext
- TypeScript و React
- Tailwind CSS
- Radix UI Icons
- Motion
- Drizzle ORM (آماده اتصال دیتابیس)

## وضعیت فعلی

- صفحه خانه عمومی مطابق طراحی دسکتاپ حاتم
- پنل شخصی کاربران با داشبورد و تحلیل بازار
- نمونه تعاملی وب‌اپ موبایل
- داشبورد پایه مشاور
- داشبورد پایه آژانس
- معماری آماده تفکیک دامنه و ساب‌دامین‌ها
