import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { consultations, conversationParticipants, conversations, reminderRules, reminders, visits } from "../../../../db/schema";
import { getRequestAccount } from "../../_lib/authorization";

export async function POST(request: Request) {
  const account = await getRequestAccount(request);
  if (!account) return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  const value = await request.json() as { eventType?: "visit" | "consultation"; eventId?: string };
  const db = getDb(), timestamp = new Date();
  const event = value.eventType === "visit"
    ? (await db.select().from(visits).where(eq(visits.id, value.eventId || "")).limit(1))[0]
    : (await db.select().from(consultations).where(eq(consultations.id, value.eventId || "")).limit(1))[0];
  if (!event || event.customerAccountId !== account.id) return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const eventType = value.eventType || "consultation", subject = eventType === "visit" ? `هماهنگی بازدید ${event.id}` : `هماهنگی مشاوره ${event.id}`;
  const existing = (await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.subject, subject)).limit(1))[0];
  if (existing) return Response.json({ ok: true, conversationId: existing.id, reminders: 0 });
  const participantIds = [event.customerAccountId, event.consultantAccountId].filter(Boolean) as string[], conversationId = `CHAT-${crypto.randomUUID()}`;
  await db.insert(conversations).values({ id: conversationId, kind: eventType === "visit" ? "visit" : "property", subject, propertyId: event.propertyId || null, agencyId: null, status: "open", createdAt: timestamp, updatedAt: timestamp });
  await db.insert(conversationParticipants).values(participantIds.map(accountId => ({ id: `CP-${crypto.randomUUID()}`, conversationId, accountId, role: accountId === account.id ? "user" : "consultant", lastReadAt: null, joinedAt: timestamp })));
  const rule = (await db.select().from(reminderRules).where(eq(reminderRules.eventType, eventType)).limit(1))[0], enabled = rule?.enabled ?? true, leadMinutes = rule?.leadMinutes ?? 120, channel = rule?.channel || "both", scheduled = event.scheduledAt || new Date(Date.now() + 24 * 60 * 60_000), reminderAt = new Date(Math.max(Date.now(), scheduled.getTime() - leadMinutes * 60_000));
  if (enabled && participantIds.length) await db.insert(reminders).values(participantIds.map(accountId => ({ id: `R-${crypto.randomUUID()}`, accountId, eventType, eventId: event.id, channel, scheduledAt: reminderAt, sentAt: null, status: "pending" as const, createdAt: timestamp })));
  return Response.json({ ok: true, conversationId, reminders: enabled ? participantIds.length : 0 });
}
