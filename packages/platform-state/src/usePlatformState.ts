"use client";

import { useContext } from "react";
import { PlatformStateContext } from "./PlatformStateContext";

export function usePlatformState() {
  const context = useContext(PlatformStateContext);
  if (!context) {
    throw new Error("usePlatformState must be used within PlatformStateProvider.");
  }
  return context;
}
