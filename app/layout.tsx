import type { Metadata } from "next";
import "./globals.css";
import "./mobile-runtime.css";
import "./prototype.css";
import "./site.css";
import "./experience.css";
import "./admin.css";
import BrandTheme from "./BrandTheme";

export const metadata: Metadata = {
  title: "املاک حاتم | مسیر روشن، کار جمع",
  description: "فایل‌های تاییدشده، مشاوره اختصاصی و جست‌وجوی هوشمند ملک در تهران با املاک حاتم.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body><BrandTheme>{children}</BrandTheme></body>
    </html>
  );
}
