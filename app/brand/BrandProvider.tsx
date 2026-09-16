"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type BrandSettings = {
  brandName: string;
  slogan: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  typeScale: number;
};

export const BRAND_LOGO_URL = "/assets/hatam/hatam-logo-transparent-gold.png";

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  brandName: "املاک حاتم",
  slogan: "مسیر روشن، کار جمع",
  logoUrl: BRAND_LOGO_URL,
  faviconUrl: "/favicon.svg",
  primaryColor: "#063326",
  secondaryColor: "#021a14",
  accentColor: "#d7ae58",
  fontFamily: "Vazirmatn",
  typeScale: 1,
};

const STORAGE_KEY = "hatam-brand-settings-v1";
type BrandContextValue = {
  settings: BrandSettings;
  draft: BrandSettings;
  setDraft: React.Dispatch<React.SetStateAction<BrandSettings>>;
  save: () => void;
  reset: () => void;
};
const BrandContext = createContext<BrandContextValue | null>(null);

function applyBrand(settings: BrandSettings) {
  const root = document.documentElement;
  root.style.setProperty("--brand-primary", settings.primaryColor);
  root.style.setProperty("--brand-secondary", settings.secondaryColor);
  root.style.setProperty("--brand-accent", settings.accentColor);
  root.style.setProperty("--brand-font", `"${settings.fontFamily}", Tahoma, sans-serif`);
  root.style.setProperty("--brand-type-scale", String(settings.typeScale));
  let favicon = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }
  favicon.href = settings.faviconUrl;
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_BRAND_SETTINGS);
  const [draft, setDraft] = useState(DEFAULT_BRAND_SETTINGS);

  useEffect(() => {
    let cancelled=false;
    fetch("/api/brand").then(response=>response.ok?response.json():Promise.reject()).then(data=>{if(cancelled)return;const parsed={...DEFAULT_BRAND_SETTINGS,...data.settings,logoUrl:BRAND_LOGO_URL} as BrandSettings;setSettings(parsed);setDraft(parsed);applyBrand(parsed)}).catch(()=>{try{const stored=window.localStorage.getItem(STORAGE_KEY);const parsed=stored?{...DEFAULT_BRAND_SETTINGS,...JSON.parse(stored),logoUrl:BRAND_LOGO_URL} as BrandSettings:DEFAULT_BRAND_SETTINGS;setSettings(parsed);setDraft(parsed);applyBrand(parsed)}catch{applyBrand(DEFAULT_BRAND_SETTINGS)}});
    return()=>{cancelled=true};
  }, []);

  const value = useMemo<BrandContextValue>(() => ({
    settings,
    draft,
    setDraft,
    save: () => {
      const next={...draft,logoUrl:BRAND_LOGO_URL};
      setSettings(next);
      setDraft(next);
      applyBrand(next);
      fetch("/api/brand",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(next)}).catch(()=>window.localStorage.setItem(STORAGE_KEY,JSON.stringify(next)));
    },
    reset: () => {
      setSettings(DEFAULT_BRAND_SETTINGS);
      setDraft(DEFAULT_BRAND_SETTINGS);
      applyBrand(DEFAULT_BRAND_SETTINGS);
      fetch("/api/brand",{method:"DELETE"}).catch(()=>window.localStorage.removeItem(STORAGE_KEY));
    },
  }), [draft, settings]);

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const value = useContext(BrandContext);
  if (!value) throw new Error("useBrand must be used inside BrandProvider");
  return value;
}
