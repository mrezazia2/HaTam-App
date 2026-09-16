import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { paymentIntents } from "../../../../db/schema";
import { getRequestAccount } from "../../_lib/authorization";

export async function GET(request: Request) {
  const account = await getRequestAccount(request);
  if (!account || account.status !== "active") {
    return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  }
  const intentId = new URL(request.url).searchParams.get("intent")?.trim() || "";
  if (!intentId) return Response.json({ ok: false, error: "PAYMENT_ID_REQUIRED" }, { status: 400 });

  const conditions = account.role === "admin"
    ? eq(paymentIntents.id, intentId)
    : and(eq(paymentIntents.id, intentId), eq(paymentIntents.accountId, account.id));
  const intent = (await getDb().select({
    id: paymentIntents.id,
    amount: paymentIntents.amount,
    purpose: paymentIntents.purpose,
    provider: paymentIntents.provider,
    providerReference: paymentIntents.providerReference,
    status: paymentIntents.status,
    createdAt: paymentIntents.createdAt,
    updatedAt: paymentIntents.updatedAt,
    verifiedAt: paymentIntents.verifiedAt,
  }).from(paymentIntents).where(conditions).limit(1))[0];

  if (!intent) return Response.json({ ok: false, error: "PAYMENT_NOT_FOUND" }, { status: 404, headers: { "cache-control": "no-store" } });
  return Response.json({ ok: true, payment: intent }, { headers: { "cache-control": "no-store" } });
}
