import { and, eq, ne } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { walletCreditStatements } from "../../_lib/wallet-credit";
import { getDb } from "../../../../db";
import { paymentIntents, subscriptionPlans, subscriptions } from "../../../../db/schema";
import { writeAudit } from "../../_lib/audit";
import { paymentResultForStatus, sanitizePaymentCallback } from "../../_lib/payment-callback";
import { verifyGatewayPayment } from "../../_lib/payment-gateway";

function redirect(url: URL, result: string, intentId?: string) {
  const target = new URL("/payment/callback", url.origin);
  target.searchParams.set("result", result);
  if (intentId) target.searchParams.set("intent", intentId);
  return new Response(null, { status: 303, headers: { location: target.toString(), "cache-control": "no-store" } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const intentId = url.searchParams.get("intent") || "";
  const db = getDb();
  const intent = (await db.select().from(paymentIntents).where(eq(paymentIntents.id, intentId)).limit(1))[0];
  if (!intent) return redirect(url, "not-found");

  if (intent.status === "paid") {
    return redirect(url, paymentResultForStatus(intent.status), intent.id);
  }
  if (!intent.authority || intent.status === "created") return redirect(url, "failed", intent.id);
  const unpaid = and(eq(paymentIntents.id, intent.id), ne(paymentIntents.status, "paid"));

  const rawCallback = Object.fromEntries(url.searchParams.entries());
  const callback = sanitizePaymentCallback(rawCallback);
  try {
    const verified = await verifyGatewayPayment(intent, rawCallback);
    const now = new Date();

    if (verified.cancelled) {
      await db.update(paymentIntents).set({ status: "cancelled", callbackPayload: callback, updatedAt: now }).where(unpaid);
      await writeAudit(db, { id: intent.accountId, role: "user" }, "payment.cancelled", "payment_intent", intent.id, "پرداخت آنلاین توسط کاربر لغو شد.", { amount: intent.amount, purpose: intent.purpose, provider: intent.provider });
      return redirect(url, "cancelled", intent.id);
    }

    if (!verified.paid) {
      await db.update(paymentIntents).set({ status: "failed", callbackPayload: callback, updatedAt: now }).where(unpaid);
      await writeAudit(db, { id: intent.accountId, role: "system" }, "payment.declined", "payment_intent", intent.id, "پرداخت آنلاین توسط درگاه تأیید نشد.", { amount: intent.amount, purpose: intent.purpose, provider: intent.provider });
      return redirect(url, "failed", intent.id);
    }

    if (intent.purpose === "wallet_topup") {
      const statements = walletCreditStatements({kind:"payment",id:intent.id,actorId:intent.accountId,actorRole:"system",now:now.getTime(),transactionId:`WT-${crypto.randomUUID()}`,auditId:`AUD-${crypto.randomUUID()}`,reference:verified.reference,callback});
      const result = await env.DB.batch(statements.map(s=>env.DB.prepare(s.sql).bind(...s.values)));
      if (result[0].meta.changes !== 1) {
        const current = (await db.select().from(paymentIntents).where(eq(paymentIntents.id,intent.id)).limit(1))[0];
        if(current?.status !== "paid") throw new Error("WALLET_CREDIT_NOT_APPLIED");
      }
      return redirect(url,"success",intent.id);
    } else {
      const subscription = (await db.select().from(subscriptions).where(eq(subscriptions.id, intent.referenceId || "")).limit(1))[0];
      const plan = subscription ? (await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, subscription.planId)).limit(1))[0] : null;
      if (!subscription || !plan) throw new Error("SUBSCRIPTION_REFERENCE_INVALID");
      const startsAt = now;
      const expiresAt = new Date(now.getTime() + plan.durationDays * 86_400_000);
      await db.batch([
        db.update(subscriptions).set({ status: "active", startsAt, expiresAt, updatedAt: now }).where(and(eq(subscriptions.id, subscription.id), eq(subscriptions.status, "pending"))),
        db.update(paymentIntents).set({ status: "paid", providerReference: verified.reference, callbackPayload: callback, verifiedAt: now, updatedAt: now }).where(unpaid),
      ]);
    }

    await writeAudit(db, { id: intent.accountId, role: "user" }, "payment.verified", "payment_intent", intent.id, "پرداخت آنلاین با موفقیت تأیید شد.", { amount: intent.amount, purpose: intent.purpose, provider: intent.provider, providerReference: verified.reference });
    return redirect(url, "success", intent.id);
  } catch (error) {
    const current = (await db.select().from(paymentIntents).where(eq(paymentIntents.id, intent.id)).limit(1))[0];
    if (current?.status === "paid") return redirect(url, "success", intent.id);

    if (error instanceof Error && error.message === "AUTHORITY_MISMATCH") return redirect(url, "failed", intent.id);
    await db.update(paymentIntents).set({ status: "failed", callbackPayload: callback, updatedAt: new Date() }).where(unpaid);
    await writeAudit(db, { id: intent.accountId, role: "system" }, "payment.verify_failed", "payment_intent", intent.id, "تأیید پرداخت آنلاین ناموفق بود.", { error: error instanceof Error ? error.message : "UNKNOWN", provider: intent.provider });
    return redirect(url, "failed", intent.id);
  }
}
