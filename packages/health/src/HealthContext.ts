import { createContext } from "react";
import type { HealthEngine } from "./HealthEngine";
import type { HealthHistoryEntry, HealthReport } from "./HealthTypes";

export interface HealthContextValue {
  engine: HealthEngine;
  report: HealthReport | null;
  history: HealthHistoryEntry[];
  isEvaluating: boolean;
  isMonitoring: boolean;
}

export const HealthContext = createContext<HealthContextValue | null>(null);
