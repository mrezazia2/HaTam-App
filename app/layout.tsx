import type { Metadata } from "next";
import { presentationMode } from "./auth/presentation";
import "./globals.css";
import "./mobile-runtime.css";
import "./prototype.css";
import "./site.css";
import "./experience.css";
import "./admin/admin.css";
import "./admin/operations.css";
import "./admin/approvals.css";
import "./admin/workspace.css";
import "./admin/navigation-polish.css";
import "./admin/urgent-sales.css";
import "./admin/integrations.css";
import "./admin/sms-settings.css";
import "./components/map-location-picker.css";
import "./components/map-modal-fixes.css";
import "./components/favorites.css";
import "./components/saved-searches.css";
import "./admin/shortcut.css";
import "./portals/portals.css";
import "./portals/wallet.css";
import "./auth/auth.css";
import "./property/property.css";
import "./role-access.css";
import "./content/content.css";
import "./theme/theme.css";
import "./communications/communications-polish.css";
import { BrandProvider } from "./brand/BrandProvider";
import { ThemeProvider } from "./theme/ThemeProvider";
import PasswordFallback from "./auth/PasswordFallback";
import PasswordSetupPrompt from "./auth/PasswordSetupPrompt";
import "./auth/password-setup.css";
import "./theme/release-readability.css";
import "./theme/ui-overrides.css";
import "./brand/scoped-appearance.css";
import "./auth/surface-contrast.css";
import "./auth/passkey-ui.css";
import "./admin/light-controls.css";
import "./pwa/pwa.css";
import PwaInstallPrompt from "./pwa/PwaInstallPrompt";

export const metadata: Metadata = {
  metadataBase: new URL("https://hatamestate.com"),
  title: "املاک حاتم | انتخاب مطمئن برای خرید و اجاره ملک",
  description: "فایل‌های تاییدشده، مشاوره اختصاصی و جست‌وجوی هوشمند ملک در تهران با املاک حاتم.",
  manifest: "/manifest.webmanifest",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: [{url:"/icons/hatam-install-v2-180.png",sizes:"180x180",type:"image/png"}],
  },
  openGraph: {
    title: "املاک حاتم",
    description: "خرید، فروش و سرمایه‌گذاری مطمئن در املاک شرق تهران.",
    type: "website",
    locale: "fa_IR",
    siteName: "املاک حاتم",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body><ThemeProvider><BrandProvider>{presentationMode() && <nav aria-label="نسخه نمایشی" style={{padding:12,background:"#073126",color:"white",display:"flex",gap:16,flexWrap:"wrap",position:"relative",zIndex:10000}}><span>نسخه نمایشی · فقط مشاهده</span>{[["/","سایت"],["/app","اپ"],["/panel","مشتری"],["/consultant","مشاور"],["/agency","آژانس"],["/admin","ادمین"]].map(([href,label])=><a key={href} href={href} style={{color:"#f4dfaa"}}>{label}</a>)}</nav>}{children}{!presentationMode() && <><PasswordFallback/><PasswordSetupPrompt/><PwaInstallPrompt/></>}</BrandProvider></ThemeProvider></body>
    </html>
  );
}
