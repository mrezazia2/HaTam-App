"use client";

import { MobileRuntime } from "./mobile";
import Prototype from "./Prototype";
import AppSplash from "./mobile/AppSplash";
import "./mobile/app-splash.css";

export default function HatamClient() {
  return (
    <MobileRuntime>
      <AppSplash />
      <Prototype />
    </MobileRuntime>
  );
}
