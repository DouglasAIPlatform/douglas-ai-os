import type { HealthIssue } from "./HealthTypes";

let issueCounter = 0;

export function createHealthIssue(
  moduleId: string,
  severity: HealthIssue["severity"],
  message: string,
): HealthIssue {
  issueCounter += 1;
  return {
    id: `issue-${moduleId}-${issueCounter}`,
    severity,
    message,
    moduleId,
    detectedAt: new Date().toISOString(),
  };
}

export function filterIssuesBySeverity(
  issues: HealthIssue[],
  severity: HealthIssue["severity"],
): HealthIssue[] {
  return issues.filter((issue) => issue.severity === severity);
}
