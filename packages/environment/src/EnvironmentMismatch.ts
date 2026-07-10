import type { EnvironmentSource } from "./EnvironmentSource";

export type EnvironmentMismatchSeverity = "warning" | "critical";

export interface EnvironmentMismatch {
  severity: EnvironmentMismatchSeverity;
  code: string;
  message: string;
  /** Valores brutos seguros — sem URLs ou secrets. */
  involvedSources: Partial<Record<EnvironmentSource, string | null>>;
}

export function isCriticalMismatch(mismatch: EnvironmentMismatch): boolean {
  return mismatch.severity === "critical";
}
