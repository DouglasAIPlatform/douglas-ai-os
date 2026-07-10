import type { ReleaseReadinessCheck } from "./ReleaseReadinessCheck.ts";
import type { ReleaseReadinessStatus } from "./ReleaseReadinessStatus.ts";

export interface ReleaseReadinessReport {
  status: ReleaseReadinessStatus;
  checkedAt: string;
  checks: ReleaseReadinessCheck[];
  passedChecks: ReleaseReadinessCheck[];
  warningChecks: ReleaseReadinessCheck[];
  blockingChecks: ReleaseReadinessCheck[];
  suggestedNextSteps: string[];
}

export function partitionReleaseReadinessChecks(checks: ReleaseReadinessCheck[]): {
  passedChecks: ReleaseReadinessCheck[];
  warningChecks: ReleaseReadinessCheck[];
  blockingChecks: ReleaseReadinessCheck[];
} {
  const passedChecks = checks.filter((check) => check.outcome === "pass");
  const blockingChecks = checks.filter(
    (check) => check.outcome === "fail" && check.blocking,
  );
  const warningChecks = checks.filter(
    (check) =>
      check.outcome === "warn" ||
      (check.outcome === "fail" && !check.blocking),
  );
  return { passedChecks, warningChecks, blockingChecks };
}

export function resolveReleaseReadinessStatus(
  checks: ReleaseReadinessCheck[],
): ReleaseReadinessStatus {
  const { blockingChecks, warningChecks } = partitionReleaseReadinessChecks(checks);

  if (blockingChecks.length > 0) {
    return "failed";
  }
  if (warningChecks.length > 0) {
    return "passed_with_warnings";
  }
  return "passed";
}

export function buildReleaseReadinessReport(
  checks: ReleaseReadinessCheck[],
  suggestedNextSteps: string[],
): ReleaseReadinessReport {
  const { passedChecks, warningChecks, blockingChecks } =
    partitionReleaseReadinessChecks(checks);

  return {
    status: resolveReleaseReadinessStatus(checks),
    checkedAt: new Date().toISOString(),
    checks,
    passedChecks,
    warningChecks,
    blockingChecks,
    suggestedNextSteps,
  };
}
