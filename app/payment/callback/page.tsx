import { headers } from "next/headers";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { paymentIntents } from "../../../db/schema";
import { getRequestAccount } from "../../api/_lib/authorization";
import "./style.css";

export default async function PaymentCallback({ searchParams }: { searchParams: Promise<{ intent?: string }> }) {
  const query = await searchParams;
  const requestHeaders = new Headers(await headers());
  const account = await getRequestAccount(new Request("https://hatamestate.com/payment/callback", { headers: requestHeaders }));
  const intent = account?.status === "active" && query.intent
    ? (await getDb().select().from(paymentIntents).where(account.role === "admin"
      ? eq(paymentIntents.id, query.intent)
      : and(eq(paymentIntents.id, query.intent), eq(paymentIntents.accountId, account.id))).limit(1))[0]
    : null;
  const success = intent?.status === "paid";
  const cancelled = intent?.status === "cancelled";
  const pending = intent?.status === "created" || intent?.status === "redirected";
  const panel = account?.role === "admin" ? "/admin" : account?.role === "consultant" ? "/consultant" : account?.role === "agency" ? "/agency" : "/panel";
  return <main className="payment-result" dir="rtl"><section>
    <div className={success ? "success" : "error"}>{success ? "✓" : "!"}</div>
    <h1>{!account ? "برای مشاهده نتیجه وارد شوید" : !intent ? "تراکنش در دسترس نیست" : success ? "پرداخت موفق بود" : cancelled ? "پرداخت لغو شد" : pending ? "پرداخت در انتظار تأیید است" : "پرداخت تأیید نشد"}</h1>
    <p>{!account ? "نتیجه پرداخت فقط به صاحب حساب نمایش داده می‌شود." : success ? "عملیات مالی با موفقیت ثبت شد و پنل شما به‌روزرسانی شده است." : pending ? "تأیید نهایی این پرداخت هنوز ثبت نشده است. وضعیت را از پنل خود پیگیری کنید." : "اگر مبلغ از حساب شما کسر شده، با پشتیبانی تماس بگیرید تا نتیجه تراکنش بررسی شود."}</p>
    {intent && <><small>شناسه پیگیری حاتم: <b dir="ltr">{intent.id}</b></small>{intent.providerReference && <small>شماره پیگیری درگاه: <b dir="ltr">{intent.providerReference}</b></small>}</>}
    <Link href={account ? panel : "/login"}>{account ? "بازگشت به پنل" : "ورود به حساب"}</Link>
  </section></main>;
}
