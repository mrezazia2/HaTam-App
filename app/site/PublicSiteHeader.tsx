"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BellIcon, Cross2Icon, HamburgerMenuIcon, HeartIcon, HomeIcon, MoonIcon, PersonIcon, SunIcon } from "@radix-ui/react-icons";
import { useBrand } from "../brand/BrandProvider";
import { useTheme } from "../theme/ThemeProvider";

type Account = { id: string; name: string; role: string } | null;

export default function PublicSiteHeader({ overlay = false }: { overlay?: boolean }) {
  const { settings } = useBrand();
  const { theme, toggleTheme } = useTheme();
  const [account, setAccount] = useState<Account>(null);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" }).then(response => response.json()).then(data => setAccount(data.account || null)).catch(() => setAccount(null));
  }, []);
  useEffect(() => {
    if (!account) { setUnread(0); return; }
    const load = () => fetch("/api/notifications", { cache: "no-store" }).then(response => response.ok ? response.json() : Promise.reject()).then(data => setUnread(Number(data.unread) || 0)).catch(() => {});
    void load();
    const events = new EventSource("/api/notifications/stream");
    events.addEventListener("notification", load);
    const fallback = window.setInterval(load, 30_000);
    return () => { events.close(); window.clearInterval(fallback); };
  }, [account]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menuOpen]);

  const panelHref = account ? account.role === "consultant" ? "/consultant" : account.role === "agency" ? "/agency" : account.role === "admin" ? "/admin" : "/panel" : "/login/user?returnTo=%2Fpanel";
  const closeMenu = () => setMenuOpen(false);

  return <header className={`public-site-header${overlay ? " public-site-header-overlay" : ""}`} dir="rtl">
    <div className="public-site-header-inner">
      <Link className="public-site-brand" href="/" onClick={closeMenu}><img src={settings.logoUrl} alt={settings.brandName} /></Link>
      <button className="public-site-menu-button" type="button" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen} aria-controls="public-site-navigation" aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}>{menuOpen ? <Cross2Icon /> : <HamburgerMenuIcon />}</button>
      <nav id="public-site-navigation" className={menuOpen ? "open" : ""} aria-label="منوی اصلی سایت">
        <Link href="/" onClick={closeMenu}><HomeIcon /> خانه</Link>
        <Link href="/ai-search" onClick={closeMenu}>جست‌وجوی هوشمند</Link>
        <Link href="/properties" onClick={closeMenu}>فایل‌ها</Link>
        <Link href="/consultants" onClick={closeMenu}>مشاوران</Link>
        <Link href="/blog" onClick={closeMenu}>وبلاگ</Link>
      </nav>
      <div className="public-site-account-actions">
        {account && <><Link className="icon-action optional-account-action" href="/notifications" aria-label={unread?`${unread.toLocaleString("fa-IR")} اعلان خوانده‌نشده`:"اعلان‌ها"}><BellIcon />{unread>0&&<i className="site-unread-badge">{Math.min(unread,99).toLocaleString("fa-IR")}</i>}</Link><Link className="icon-action optional-account-action" href="/favorites" aria-label="علاقه‌مندی‌ها"><HeartIcon /></Link></>}
        <button className="icon-action" type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "فعال‌کردن حالت روشن" : "فعال‌کردن حالت تاریک"}>{theme === "dark" ? <SunIcon /> : <MoonIcon />}</button>
        <Link className="panel-action" href={panelHref}><PersonIcon /><span>{account ? "پنل کاربری" : "ورود به پنل"}</span></Link>
      </div>
    </div>
  </header>;
}
