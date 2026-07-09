import type { DiagnosticRecommendation } from "./DiagnosticsTypes";

let recCounter = 0;

export function createDiagnosticRecommendation(
  priority: DiagnosticRecommendation["priority"],
  message: string,
  moduleId?: string,
): DiagnosticRecommendation {
  recCounter += 1;
  return {
    id: `diag-rec-${recCounter}`,
    priority,
    message,
    moduleId,
  };
}
