"use client";

import { useContext } from "react";
import { DiagnosticsContext } from "./DiagnosticsContext";

export function useBootDiagnostics() {
  const context = useContext(DiagnosticsContext);
  if (!context) {
    throw new Error("useBootDiagnostics must be used within DiagnosticsProvider.");
  }
  return context;
}
