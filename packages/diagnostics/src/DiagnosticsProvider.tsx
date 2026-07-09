"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BootDiagnostics } from "./BootDiagnostics";
import { DiagnosticsContext } from "./DiagnosticsContext";
import type {
  DiagnosticsInput,
  DiagnosticsReportEventPayload,
  ReadinessReport,
} from "./DiagnosticsTypes";

export interface DiagnosticsProviderProps {
  children: ReactNode;
  input: DiagnosticsInput;
  enabled?: boolean;
  refreshIntervalMs?: number;
  publish?: (topic: string, payload: DiagnosticsReportEventPayload) => void;
  diagnostics?: BootDiagnostics;
  onReportChange?: (report: ReadinessReport | null) => void;
}

export function DiagnosticsProvider({
  children,
  input,
  enabled = true,
  refreshIntervalMs = 15000,
  publish,
  diagnostics: externalDiagnostics,
  onReportChange,
}: DiagnosticsProviderProps) {
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef(input);

  inputRef.current = input;

  const diagnostics = useMemo(
    () => externalDiagnostics ?? new BootDiagnostics({ publish }),
    [externalDiagnostics, publish],
  );

  const regenerate = useCallback(async () => {
    if (!enabled) return;

    setIsGenerating(true);
    try {
      const nextReport = await diagnostics.generate(inputRef.current);
      setReport(nextReport);
      onReportChange?.(nextReport);
    } catch {
      const fallback = diagnostics.getLastReport();
      setReport(fallback);
      onReportChange?.(fallback);
    } finally {
      setIsGenerating(false);
    }
  }, [diagnostics, enabled, onReportChange]);

  useEffect(() => {
    if (!enabled) return;
    void regenerate();
  }, [enabled, regenerate, input]);

  useEffect(() => {
    if (!enabled || refreshIntervalMs <= 0) return;

    const timer = window.setInterval(() => {
      void regenerate();
    }, refreshIntervalMs);

    return () => window.clearInterval(timer);
  }, [enabled, refreshIntervalMs, regenerate]);

  const value = useMemo(
    () => ({
      diagnostics,
      report,
      isGenerating,
      regenerate,
    }),
    [diagnostics, isGenerating, regenerate, report],
  );

  return (
    <DiagnosticsContext.Provider value={value}>{children}</DiagnosticsContext.Provider>
  );
}
