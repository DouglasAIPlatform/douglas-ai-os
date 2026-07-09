import type { SupabaseReadinessStatus } from "./SupabaseReadinessStatus";
import type { SupabaseValidationCheck } from "./SupabaseValidationCheck";

export interface SupabaseValidationReport {
  readinessStatus: SupabaseReadinessStatus;
  checkedAt: string;
  checks: SupabaseValidationCheck[];
  passedChecks: SupabaseValidationCheck[];
  alertChecks: SupabaseValidationCheck[];
  suggestedNextSteps: string[];
}

export function partitionValidationChecks(checks: SupabaseValidationCheck[]): {
  passedChecks: SupabaseValidationCheck[];
  alertChecks: SupabaseValidationCheck[];
} {
  const passedChecks = checks.filter((check) => check.outcome === "pass");
  const alertChecks = checks.filter(
    (check) => check.outcome === "warn" || check.outcome === "fail",
  );
  return { passedChecks, alertChecks };
}

export function buildValidationReport(
  readinessStatus: SupabaseReadinessStatus,
  checks: SupabaseValidationCheck[],
  suggestedNextSteps: string[],
): SupabaseValidationReport {
  const { passedChecks, alertChecks } = partitionValidationChecks(checks);
  return {
    readinessStatus,
    checkedAt: new Date().toISOString(),
    checks,
    passedChecks,
    alertChecks,
    suggestedNextSteps,
  };
}
