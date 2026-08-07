"use client";

import { useEffect, useState } from "react";
import {
  BRAND_SETTINGS_EVENT,
  BrandSettings,
  defaultBrandSettings,
  readBrandSettings,
} from "./brand-settings";

export function useBrandSettings() {
  const [settings, setSettings] = useState<BrandSettings>(defaultBrandSettings);

  useEffect(() => {
    const sync = () => setSettings(readBrandSettings());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(BRAND_SETTINGS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(BRAND_SETTINGS_EVENT, sync);
    };
  }, []);

  return settings;
}

export default function BrandTheme({ children }: { children: React.ReactNode }) {
  const settings = useBrandSettings();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", settings.primaryColor);
    root.style.setProperty("--brand-deep", settings.deepColor);
    root.style.setProperty("--brand-accent", settings.accentColor);
    root.style.setProperty("--brand-accent-soft", settings.accentSoftColor);
    root.style.setProperty("--brand-surface", settings.surfaceColor);
    root.style.setProperty("--brand-font-family", `"${settings.fontFamily}", Tahoma, sans-serif`);
    root.style.setProperty("--brand-font-scale", String(settings.fontScale));
    const pageTitle = `${settings.brandName} | ${settings.slogan}`;
    document.title = pageTitle;
    const titleGuard = window.setTimeout(() => { document.title = pageTitle; }, 120);

    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = settings.faviconUrl;
    return () => window.clearTimeout(titleGuard);
  }, [settings]);

  return <>{children}</>;
}

export function BrandLogo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const settings = useBrandSettings();
  return (
    <span className={`brand-lockup ${className}`.trim()}>
      <img src={settings.logoUrl} alt={settings.brandName} />
      {!compact && <small>{settings.slogan}</small>}
    </span>
  );
}

export function BrandName() {
  const settings = useBrandSettings();
  return <>{settings.brandName}</>;
}

export function BrandSlogan() {
  const settings = useBrandSettings();
  return <>{settings.slogan}</>;
}
