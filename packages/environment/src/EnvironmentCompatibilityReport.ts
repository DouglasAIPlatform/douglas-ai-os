import type { EnvironmentMismatch } from "./EnvironmentMismatch";
import type { EnvironmentResolution } from "./EnvironmentResolution";

export interface EnvironmentCompatibilityReport {
  resolution: EnvironmentResolution;
  compatible: boolean;
  criticalMismatches: EnvironmentMismatch[];
  warningMismatches: EnvironmentMismatch[];
  summary: string;
}

export function buildEnvironmentCompatibilityReport(
  resolution: EnvironmentResolution,
): EnvironmentCompatibilityReport {
  const criticalMismatches = resolution.mismatches.filter((m) => m.severity === "critical");
  const warningMismatches = resolution.mismatches.filter((m) => m.severity === "warning");
  const compatible = criticalMismatches.length === 0 && !resolution.hasCriticalMismatch;

  let summary = `Canônico: ${resolution.canonical}`;
  if (criticalMismatches.length > 0) {
    summary += ` — ${criticalMismatches.length} divergência(s) crítica(s)`;
  } else if (warningMismatches.length > 0) {
    summary += ` — ${warningMismatches.length} alerta(s)`;
  } else {
    summary += " — fontes alinhadas";
  }

  return {
    resolution,
    compatible,
    criticalMismatches,
    warningMismatches,
    summary,
  };
}
