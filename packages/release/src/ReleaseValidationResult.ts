import type { ReleaseChannel } from "./ReleaseChannel";
import type { ReleaseStatus } from "./ReleaseStatus";

export type ReleaseValidationSeverity = "error" | "warning" | "info";

export interface ReleaseValidationIssue {
  severity: ReleaseValidationSeverity;
  code: string;
  message: string;
  source?: string;
  expected?: string;
  actual?: string;
}

export interface ReleaseValidationResult {
  valid: boolean;
  issues: ReleaseValidationIssue[];
  checkedAt: string;
}

export interface VersionConsistencyTarget {
  id: string;
  label: string;
  path: string;
  version: string | null;
}

export interface VersionConsistencyReport {
  manifestVersion: string;
  targets: VersionConsistencyTarget[];
  divergences: VersionConsistencyTarget[];
  consistent: boolean;
}

export function buildReleaseValidationResult(
  issues: ReleaseValidationIssue[],
): ReleaseValidationResult {
  const hasErrors = issues.some((issue) => issue.severity === "error");
  return {
    valid: !hasErrors,
    issues,
    checkedAt: new Date().toISOString(),
  };
}

export interface ReleaseStatusSnapshot {
  version: string;
  channel: ReleaseChannel;
  platform: string;
  releaseStatus: ReleaseStatus;
  environment: string;
  environmentLabel: string;
  versionConsistent: boolean;
  staticReadinessValid: boolean;
  runtimeReadinessHint: string;
  workingCopyHint: string;
  manualReleaseNotice: string;
  alerts: string[];
  metadataSummary: string | null;
}
