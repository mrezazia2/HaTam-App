"use client";

import { usePathname } from "next/navigation";
import { HomeExperience } from "../Experience";
import HatamClient from "../HatamClient";

export default function HatamWebApp() {
  // Guard the two independent experiences against a Vinext route-manifest
  // collision observed in production when both `/` and `/app` are present.
  const pathname = usePathname();
  if (pathname === "/") return <HomeExperience />;
  return <div className="mobile-route"><HatamClient /></div>;
}
