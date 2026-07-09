"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { HealthContext } from "./HealthContext";
import { createHealthEngine, type HealthEngine } from "./HealthEngine";
import type { HealthCheckDefinition, HealthReport } from "./HealthTypes";

export interface HealthProviderProps {
  children: ReactNode;
  checks: HealthCheckDefinition[];
  enabled?: boolean;
  engine?: HealthEngine;
  monitorIntervalMs?: number;
}

export function HealthProvider({
  children,
  checks,
  enabled = true,
  engine: externalEngine,
  monitorIntervalMs,
}: HealthProviderProps) {
  const [engine] = useState(
    () => externalEngine ?? createHealthEngine({ monitorIntervalMs }),
  );
  const [report, setReport] = useState<HealthReport | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    engine.registerChecks(checks);
  }, [checks, engine]);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    setIsEvaluating(true);

    engine
      .evaluate()
      .then((initialReport) => {
        if (!active) return;
        setReport(initialReport);
        setIsEvaluating(false);
        setVersion((current) => current + 1);
      })
      .catch(() => {
        if (!active) return;
        setIsEvaluating(false);
        setVersion((current) => current + 1);
      });

    engine.startMonitoring((nextReport) => {
      if (!active) return;
      setReport(nextReport);
      setVersion((current) => current + 1);
    });

    return () => {
      active = false;
      engine.stopMonitoring();
    };
  }, [enabled, engine]);

  const value = useMemo(
    () => ({
      engine,
      report,
      history: engine.getHistory(10),
      isEvaluating,
      isMonitoring: engine.isMonitoring(),
    }),
    [engine, isEvaluating, report, version],
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}
