"use client";

import dynamic from "next/dynamic";

const HatamClient = dynamic(() => import("./HatamClient"), {
  ssr: false,
  loading: () => <div className="hatam-loading" aria-label="در حال آماده‌سازی اپلیکیشن" />,
});

export default function Home() {
  return (
    <HatamClient />
  );
}
