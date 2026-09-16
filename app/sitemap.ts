import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { contentPages, properties } from "../db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://hatamestate.ir";
  const [propertyRows, pageRows] = await Promise.all([
    getDb().select({ id: properties.id, updatedAt: properties.updatedAt }).from(properties).where(eq(properties.status, "published")),
    getDb().select({ slug: contentPages.slug, updatedAt: contentPages.updatedAt }).from(contentPages).where(eq(contentPages.status, "published")),
  ]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/consultants`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/trust`, changeFrequency: "weekly", priority: 0.6 },
    ...propertyRows.map((item) => ({ url: `${base}/property/${encodeURIComponent(item.id)}`, lastModified: item.updatedAt, changeFrequency: "daily" as const, priority: 0.9 })),
    ...pageRows.map((item) => ({ url: `${base}/content/${encodeURIComponent(item.slug)}`, lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
