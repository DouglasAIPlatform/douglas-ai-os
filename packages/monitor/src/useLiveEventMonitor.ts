"use client";

import { useContext } from "react";
import { EventMonitorContext } from "./EventMonitorContext";

export function useLiveEventMonitor() {
  const context = useContext(EventMonitorContext);
  if (!context) {
    throw new Error("useLiveEventMonitor must be used within EventMonitorProvider.");
  }
  return context;
}
