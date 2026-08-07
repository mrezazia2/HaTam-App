export type BrandSettings = {
  brandName: string;
  slogan: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  deepColor: string;
  accentColor: string;
  accentSoftColor: string;
  surfaceColor: string;
  fontFamily: string;
  fontScale: number;
};

export const BRAND_SETTINGS_KEY = "hatam-brand-settings-v1";
export const BRAND_SETTINGS_EVENT = "hatam-brand-settings-change";

export const defaultBrandSettings: BrandSettings = {
  brandName: "املاک حاتم",
  slogan: "مسیر روشن، کار جمع",
  logoUrl: "/assets/hatam/logo.png",
  faviconUrl: "/favicon.svg",
  primaryColor: "#062b21",
  deepColor: "#031c16",
  accentColor: "#d7ad55",
  accentSoftColor: "#ead18d",
  surfaceColor: "#f4f2eb",
  fontFamily: "Vazirmatn",
  fontScale: 1,
};

export function readBrandSettings(): BrandSettings {
  if (typeof window === "undefined") return defaultBrandSettings;
  try {
    const stored = window.localStorage.getItem(BRAND_SETTINGS_KEY);
    return stored ? { ...defaultBrandSettings, ...JSON.parse(stored) } : defaultBrandSettings;
  } catch {
    return defaultBrandSettings;
  }
}

export function saveBrandSettings(settings: BrandSettings) {
  window.localStorage.setItem(BRAND_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(BRAND_SETTINGS_EVENT, { detail: settings }));
}
