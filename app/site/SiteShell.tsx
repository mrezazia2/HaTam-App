"use client";

import Link from "next/link";
import { useBrand } from "../brand/BrandProvider";
import PublicSiteHeader from "./PublicSiteHeader";

export default function SiteShell({ children, title, eyebrow = "املاک حاتم", description, actions }: { children: React.ReactNode; title: string; eyebrow?: string; description?: string; actions?: React.ReactNode }) {
  const { settings } = useBrand();
  return <main className="public-site-page" dir="rtl">
    <PublicSiteHeader />
    <section className="public-site-hero"><div><span>{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}{actions && <div className="public-site-hero-actions">{actions}</div>}</div></section>
    <div className="public-site-content">{children}</div>
    <footer className="public-site-footer"><img src={settings.logoUrl} alt="" /><div><strong>{settings.brandName}</strong><span>{settings.slogan}</span></div><nav><Link href="/contact">ارتباط با ما</Link><Link href="/subscriptions">اشتراک‌ها</Link><Link href="/requests">درخواست‌های من</Link></nav></footer>
  </main>;
}
