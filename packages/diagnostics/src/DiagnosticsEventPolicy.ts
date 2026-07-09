import type { ReadinessReport } from "./DiagnosticsTypes";
import { READINESS_SCORE_POLICY } from "./ReadinessScorePolicy";

function criticalFingerprints(report: ReadinessReport): Set<string> {
  return new Set(report.criticalIssues.map((issue) => `${issue.source}:${issue.message}`));
}

/** Decide se diagnostics:report:completed deve ser publicado. */
export function shouldPublishDiagnosticsCompleted(
  previous: ReadinessReport | null,
  current: ReadinessReport,
): boolean {
  if (!previous) return true;

  if (previous.status !== current.status) return true;

  if (
    Math.abs(previous.score - current.score) >=
    READINESS_SCORE_POLICY.SCORE_CHANGE_THRESHOLD
  ) {
    return true;
  }

  const prevCritical = criticalFingerprints(previous);
  const currCritical = criticalFingerprints(current);

  for (const fingerprint of currCritical) {
    if (!prevCritical.has(fingerprint)) return true;
  }

  for (const fingerprint of prevCritical) {
    if (!currCritical.has(fingerprint)) return true;
  }

  return false;
}
