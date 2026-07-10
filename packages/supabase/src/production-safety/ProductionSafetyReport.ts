import type { SupabaseEnvironment } from "../SupabaseEnvironment";
import type { ProductionSafetyCheck } from "./ProductionSafetyCheck";
import type { ProductionSafetyStatus } from "./ProductionSafetyStatus";

export interface ProductionSafetyReport {
  status: ProductionSafetyStatus;
  environment: SupabaseEnvironment;
  checkedAt: string;
  checks: ProductionSafetyCheck[];
  passedChecks: ProductionSafetyCheck[];
  blockingChecks: ProductionSafetyCheck[];
  alertChecks: ProductionSafetyCheck[];
  suggestedNextSteps: string[];
}

export function partitionProductionSafetyChecks(checks: ProductionSafetyCheck[]): {
  passedChecks: ProductionSafetyCheck[];
  blockingChecks: ProductionSafetyCheck[];
  alertChecks: ProductionSafetyCheck[];
} {
  const passedChecks = checks.filter((check) => check.outcome === "pass");
  const blockingChecks = checks.filter(
    (check) => check.outcome === "fail" && check.blocking,
  );
  const alertChecks = checks.filter(
    (check) =>
      check.outcome === "warn" ||
      (check.outcome === "fail" && !check.blocking),
  );
  return { passedChecks, blockingChecks, alertChecks };
}

export function buildProductionSafetyReport(
  status: ProductionSafetyStatus,
  environment: SupabaseEnvironment,
  checks: ProductionSafetyCheck[],
  suggestedNextSteps: string[],
): ProductionSafetyReport {
  const { passedChecks, blockingChecks, alertChecks } =
    partitionProductionSafetyChecks(checks);
  return {
    status,
    environment,
    checkedAt: new Date().toISOString(),
    checks,
    passedChecks,
    blockingChecks,
    alertChecks,
    suggestedNextSteps,
  };
}
