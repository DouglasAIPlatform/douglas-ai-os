"use client";

import { useContext } from "react";
import { AutomationContext } from "./AutomationContext";

export function useAutomationEngine() {
  const context = useContext(AutomationContext);

  if (!context) {
    throw new Error("useAutomationEngine must be used inside AutomationProvider.");
  }

  return context;
}
