import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { conversationParticipants, conversations, notifications, reminderRules, reminders } from "../../../db/schema";

type Db = ReturnType<typeof getDb>;
type WorkflowType = "visit" | "consultation" | "contract";

export async function notifyWorkflow(db: Db, accountIds: Array<string | null | undefined>, type: string, title: string, body: string, link: string, createdAt: Date) {
  const recipients = [...new Set(accountIds.filter(Boolean) as string[])];
  if (!recipients.length) return;
  await db.insert(notifications).values(recipients.map(accountId => ({
    id: `N-${crypto.randomUUID()}`, accountId, type, title, body, link, readAt: null, createdAt,
  })));
}

export async function replaceWorkflowReminders(db: Db, eventType: WorkflowType, eventId: string, scheduledAt: Date | null, accountIds: Array<string | null | undefined>, createdAt: Date) {
  await db.update(reminders).set({ status: "cancelled", lockedAt: null, lockToken: null }).where(and(eq(reminders.eventType, eventType), eq(reminders.eventId, eventId), eq(reminders.status, "pending")));
  if (!scheduledAt) return 0;
  const rule = (await db.select().from(reminderRules).where(eq(reminderRules.eventType, eventType)).limit(1))[0];
  if (rule?.enabled === false) return 0;
  const recipients = [...new Set(accountIds.filter(Boolean) as string[])];
  if (!recipients.length) return 0;
  const leadMinutes = rule?.leadMinutes ?? 120;
  const channel = rule?.channel ?? "both";
  const reminderAt = new Date(Math.max(createdAt.getTime(), scheduledAt.getTime() - leadMinutes * 60_000));
  await db.insert(reminders).values(recipients.map(accountId => ({
    id: `R-${crypto.randomUUID()}`, accountId, eventType, eventId, channel,
    scheduledAt: reminderAt, sentAt: null, status: "pending" as const,
    lockedAt: null, lockToken: null, createdAt,
  })));
  return recipients.length;
}

export async function cancelWorkflowReminders(db: Db, eventType: WorkflowType, eventId: string) {
  await db.update(reminders).set({ status: "cancelled", lockedAt: null, lockToken: null }).where(and(eq(reminders.eventType, eventType), eq(reminders.eventId, eventId), eq(reminders.status, "pending")));
}

export async function createWorkflowConversation(db: Db, eventType: WorkflowType, eventId: string, propertyId: string | null, agencyId: string | null, customerAccountId: string, consultantAccountId: string | null, createdAt: Date) {
  if (!consultantAccountId) return null;
  const subject = eventType === "visit" ? `هماهنگی بازدید ${eventId}` : eventType === "contract" ? `هماهنگی قرارداد ${eventId}` : `هماهنگی مشاوره ${eventId}`;
  const existing = (await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.subject, subject)).limit(1))[0];
  if (existing) return existing.id;
  const conversationId = `CHAT-${crypto.randomUUID()}`;
  await db.insert(conversations).values({
    id: conversationId, kind: eventType === "visit" ? "visit" : eventType === "contract" ? "contract" : "property",
    subject,
    propertyId, agencyId, status: "open", createdAt, updatedAt: createdAt,
  });
  await db.insert(conversationParticipants).values([
    { id: `CP-${crypto.randomUUID()}`, conversationId, accountId: customerAccountId, role: "user", lastReadAt: null, joinedAt: createdAt },
    { id: `CP-${crypto.randomUUID()}`, conversationId, accountId: consultantAccountId, role: "consultant", lastReadAt: null, joinedAt: createdAt },
  ]);
  return conversationId;
}
