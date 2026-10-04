import {serviceFetch,validateServiceUrl} from "../../_lib/service-fetch";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { integrationSettings } from "../../../../db/schema";
import { forbidden, requireAdmin } from "../../_lib/authorization";
import { decryptSecret } from "../../_lib/secrets";
import { writeAudit } from "../../_lib/audit";
import { toGatewayAmount } from "../../_lib/money";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return forbidden();
  const value = await request.json() as { action?: "validate" | "create_test"; amount?: number };
  const db = getDb();
  const settings = (await db.select().from(integrationSettings).where(eq(integrationSettings.category, "payment_gateway")).limit(1))[0];
  if (!settings) return Response.json({ ok: false, message: "ابتدا تنظیمات درگاه را ذخیره کنید." }, { status: 400 });

  const config = settings.publicConfig;
  const missing = validate(config, Boolean(settings.encryptedSecret));
  if (missing.length) {
    await writeAudit(db, admin, "payment.config_validation_failed", "integration", "payment_gateway", "بررسی تنظیمات درگاه ناموفق بود.", { missing });
    return Response.json({ ok: false, missing, message: `فیلدهای ناقص: ${missing.join("، ")}` }, { status: 400 });
  }
  try{for(const key of ["requestUrl","verifyUrl","paymentUrlTemplate"])validateServiceUrl(config[key].replace("{authority}","sample"))}
  catch{return Response.json({ok:false,message:"دامنه سرویس مجاز نیست یا آدرس HTTPS امن نیست."},{status:400})}
  if (value.action !== "create_test") {
    await writeAudit(db, admin, "payment.config_validated", "integration", "payment_gateway", "ساختار تنظیمات درگاه با موفقیت بررسی شد.", { provider: settings.provider });
    return Response.json({ ok: true, message: "ساختار درگاه کامل است؛ برای اطمینان از Merchant آزمایش اتصال را اجرا کنید." });
  }

  const secret = settings.encryptedSecret ? await decryptSecret(settings.encryptedSecret) : "";
  const amountInToman = Math.max(1_000, Math.round(Number(value.amount) || 1_000));
  const gatewayAmount = toGatewayAmount(amountInToman, config.amountUnit || "toman");
  const payload: Record<string, unknown> = {};
  payload[config.merchantField || "merchant_id"] = config.merchantId || secret;
  payload[config.amountField || "amount"] = gatewayAmount;
  payload[config.callbackField || "callback_url"] = config.callbackUrl;
  payload[config.descriptionField || "description"] = "آزمایش اتصال درگاه املاک حاتم";
  const headers: Record<string, string> = { "content-type": config.contentType || "application/json" };
  if (config.authHeader) headers[config.authHeader] = `${config.authPrefix || ""}${secret}`;
  try {
    const started = Date.now();
    const response = await serviceFetch(config.requestUrl, { method: config.apiMethod === "PUT" ? "PUT" : "POST", headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(Math.min(60_000, Math.max(2_000, Number(config.timeoutMs) || 20_000))) });
    const data = await response.json().catch(() => ({}));
    const authority = String(readPath(data, config.authorityPath || "data.authority") || "");
    const durationMs = Date.now() - started;
    const ok = response.ok && Boolean(authority);
    await writeAudit(db, admin, ok ? "payment.test_created" : "payment.test_failed", "integration", "payment_gateway", ok ? "درخواست آزمایشی درگاه با موفقیت ساخته شد." : "سرویس درگاه درخواست آزمایشی را نپذیرفت.", { provider: settings.provider, status: response.status, durationMs, authorityReceived: Boolean(authority), amountInToman, gatewayAmount, gatewayUnit: config.amountUnit || "toman" });
    return Response.json({ ok, status: response.status, durationMs, message: ok ? "اتصال و Merchant معتبر است؛ درخواست آزمایشی ایجاد شد." : `درگاه پاسخ معتبر نداد (HTTP ${response.status}).` }, { status: ok ? 200 : 502 });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError" ? "مهلت پاسخ درگاه تمام شد." : "ارتباط با درگاه برقرار نشد.";
    await writeAudit(db, admin, "payment.test_failed", "integration", "payment_gateway", message, { provider: settings.provider, error: error instanceof Error ? error.name : "UNKNOWN" });
    return Response.json({ ok: false, message }, { status: 502 });
  }
}

function validate(config: Record<string, string>, hasSecret: boolean) {
  const required: [string, string][] = [["requestUrl", "API ایجاد پرداخت"], ["verifyUrl", "API تأیید پرداخت"], ["paymentUrlTemplate", "آدرس انتقال"], ["callbackUrl", "Callback"], ["merchantField", "فیلد Merchant"], ["amountField", "فیلد مبلغ"], ["authorityPath", "مسیر Authority"], ["verifyCodePath", "مسیر کد تأیید"]];
  const missing = required.filter(([key]) => !config[key]?.trim()).map(([, label]) => label);
  if (!config.merchantId?.trim() && !hasSecret) missing.push("Merchant یا کلید خصوصی");
  return [...new Set(missing)];
}
function readPath(value: unknown, key: string) { return key.split(".").filter(Boolean).reduce<unknown>((current, part) => current && typeof current === "object" ? (current as Record<string, unknown>)[part] : undefined, value); }
