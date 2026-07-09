import type { DiagnosticIssue, DiagnosticSeverity } from "./DiagnosticsTypes";

let issueCounter = 0;

export function createDiagnosticIssue(
  severity: DiagnosticSeverity,
  message: string,
  source: string,
  moduleId?: string,
): DiagnosticIssue {
  issueCounter += 1;
  return {
    id: `diag-issue-${issueCounter}`,
    severity,
    message,
    moduleId,
    source,
    detectedAt: new Date().toISOString(),
  };
}
