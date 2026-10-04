import { desc, and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { contentPages } from "../../../db/schema";
export const dynamic="force-dynamic";
export async function GET(){const items=await getDb().select().from(contentPages).where(and(eq(contentPages.status,"published"),eq(contentPages.target,"site"))).orderBy(desc(contentPages.updatedAt));return Response.json({ok:true,items})}
