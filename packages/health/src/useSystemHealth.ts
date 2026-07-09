"use client";

import { useContext } from "react";
import { HealthContext } from "./HealthContext";

export function useSystemHealth() {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error("useSystemHealth must be used within HealthProvider.");
  }
  return context;
}
