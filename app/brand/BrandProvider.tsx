"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {appearanceScopes,cleanAppearance,defaultAppearance,type AppearanceSettings} from "./appearance";

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
  appearance: AppearanceSettings;
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
  appearance: defaultAppearance,
};

const STORAGE_KEY = "hatam-brand-settings-v1";
type BrandContextValue = {
  settings: BrandSettings;
  draft: BrandSettings;
  setDraft: React.Dispatch<React.SetStateAction<BrandSettings>>;
  save: () => Promise<void>;
  reset: () => Promise<void>;
};
const BrandContext = createContext<BrandContextValue | null>(null);

function applyBrand(settings: BrandSettings) {
  const root = document.documentElement;
  root.style.setProperty("--brand-primary", settings.primaryColor);
  root.style.setProperty("--brand-secondary", settings.secondaryColor);
  root.style.setProperty("--brand-accent", settings.accentColor);
  root.style.setProperty("--brand-font", `"${settings.fontFamily}", Tahoma, sans-serif`);
  root.style.setProperty("--brand-type-scale", String(settings.typeScale));
  const appearance=cleanAppearance(settings.appearance);
  for(const scope of appearanceScopes){
    root.style.setProperty(`--${scope}-font-family`, `"${appearance[scope].fontFamily}", Tahoma, sans-serif`);
    root.style.setProperty(`--${scope}-font-scale`, String(appearance[scope].fontScale));
    for(const mode of ["light","dark"] as const)for(const [key,color] of Object.entries(appearance[scope][mode]))root.style.setProperty(`--${scope}-${mode}-${key}`,color);
  }
  let favicon = document.querySelector<HTMLLinkElement>("link[data-hatam-favicon]");
  if (!favicon) { favicon = document.createElement("link"); favicon.rel = "icon"; favicon.dataset.hatamFavicon = "true"; document.head.appendChild(favicon); }
  favicon.href = settings.faviconUrl;
  document.querySelectorAll<HTMLLinkElement>("link[rel='icon'],link[rel='shortcut icon']").forEach(link => { link.href = settings.faviconUrl; });
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_BRAND_SETTINGS);
  const [draft, setDraft] = useState(DEFAULT_BRAND_SETTINGS);

  useEffect(() => {
    let cancelled=false;
    fetch("/api/brand").then(response=>response.ok?response.json():Promise.reject()).then(data=>{if(cancelled)return;const parsed={...DEFAULT_BRAND_SETTINGS,...data.settings,appearance:cleanAppearance(data.settings?.appearance)} as BrandSettings;setSettings(parsed);setDraft(parsed);applyBrand(parsed)}).catch(()=>{try{const stored=window.localStorage.getItem(STORAGE_KEY);const parsed=stored?{...DEFAULT_BRAND_SETTINGS,...JSON.parse(stored),appearance:cleanAppearance(JSON.parse(stored).appearance)} as BrandSettings:DEFAULT_BRAND_SETTINGS;setSettings(parsed);setDraft(parsed);applyBrand(parsed)}catch{applyBrand(DEFAULT_BRAND_SETTINGS)}});
    return()=>{cancelled=true};
  }, []);

  const value = useMemo<BrandContextValue>(() => ({
    settings,
    draft,
    setDraft,
    save: async () => {
      const response=await fetch("/api/brand",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(draft)});
      if(!response.ok)throw new Error("ذخیره تنظیمات برند در سرور انجام نشد.");
      setSettings(draft);applyBrand(draft);
      window.localStorage.setItem(STORAGE_KEY,JSON.stringify(draft));
    },
    reset: async () => {
      const response=await fetch("/api/brand",{method:"DELETE"});
      if(!response.ok)throw new Error("بازنشانی تنظیمات برند در سرور انجام نشد.");
      setSettings(DEFAULT_BRAND_SETTINGS);
      setDraft(DEFAULT_BRAND_SETTINGS);
      applyBrand(DEFAULT_BRAND_SETTINGS);
      window.localStorage.removeItem(STORAGE_KEY);
    },
  }), [draft, settings]);

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const value = useContext(BrandContext);
  if (!value) throw new Error("useBrand must be used inside BrandProvider");
  return value;
}
