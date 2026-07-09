"use client";

import { useContext } from "react";
import { RuntimeContext } from "./RuntimeContext";

export function usePlatformRuntime() {
  const context = useContext(RuntimeContext);
  if (!context) {
    throw new Error("usePlatformRuntime must be used within RuntimeProvider.");
  }
  return context;
}
