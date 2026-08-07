import type { Metadata } from "next";
import "./globals.css";
import "./mobile-runtime.css";
import "./prototype.css";

export const metadata: Metadata = {
  title: "املاک حاتم",
  description: "جست‌وجو و بررسی فایل‌های تاییدشده املاک حاتم",
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
      <body>{children}</body>
    </html>
  );
}
