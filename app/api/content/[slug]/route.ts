import { asc, and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { contentBlocks, contentPages } from "../../../../db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const page = (await db.select().from(contentPages).where(and(eq(contentPages.slug, slug), eq(contentPages.status, "published"))).limit(1))[0];
  if (!page) return new URL(request.url).searchParams.get('optional')==='1'?Response.json({ok:true,page:null}):Response.json({ ok: false, error: "PAGE_NOT_FOUND" }, { status: 404 });
  const blocks = await db.select().from(contentBlocks).where(eq(contentBlocks.pageId, page.id)).orderBy(asc(contentBlocks.sortOrder));
  return Response.json({ ok: true, page: { ...page, status: "منتشرشده", blocks } });
}
