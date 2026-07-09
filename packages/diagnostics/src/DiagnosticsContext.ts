"use client";

import { createContext } from "react";
import type { BootDiagnostics } from "./BootDiagnostics";
import type { ReadinessReport } from "./DiagnosticsTypes";

export interface DiagnosticsContextValue {
  diagnostics: BootDiagnostics;
  report: ReadinessReport | null;
  isGenerating: boolean;
  regenerate: () => Promise<void>;
}

export const DiagnosticsContext = createContext<DiagnosticsContextValue | null>(null);
