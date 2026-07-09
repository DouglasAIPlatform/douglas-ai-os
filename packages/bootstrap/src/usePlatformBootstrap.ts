"use client";

import { useContext } from "react";
import { PlatformBootstrapContext } from "./PlatformBootstrapContext";

export function usePlatformBootstrap() {
  const context = useContext(PlatformBootstrapContext);

  if (!context) {
    throw new Error("usePlatformBootstrap must be used inside BootstrapProvider.");
  }

  return context;
}
