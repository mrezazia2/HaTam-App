import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { contracts, properties } from "../../../db/schema";
import { getRequestAccount } from "../_lib/authorization";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const account = await getRequestAccount(request);
  if (!account || account.status !== "active") return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  const db = getDb();
  const scope = account.role === "admin" ? undefined : account.role === "user" ? eq(contracts.customerAccountId, account.id) : account.role === "consultant" ? eq(contracts.consultantAccountId, account.id) : account.agencyId ? eq(contracts.agencyId, account.agencyId) : eq(contracts.agencyId, "__none__");
  const rows = await db.select({ contract: contracts, propertyTitle: properties.title }).from(contracts).leftJoin(properties, eq(contracts.propertyId, properties.id)).where(scope).orderBy(desc(contracts.updatedAt));
  return Response.json({ ok: true, items: rows.map(row => ({ ...row.contract, propertyTitle: row.propertyTitle })) });
}
