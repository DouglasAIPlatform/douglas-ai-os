import type { StagingBootstrapStatus } from "./StagingBootstrapStatus";
import type { StagingConfigurationSnapshot } from "./StagingConfigurationSnapshot";
import type { StagingReadinessRequirementId } from "./StagingReadinessRequirement";

export type StagingReadinessCheckOutcome = "pass" | "warn" | "fail" | "pending_runtime";

export type StagingReadinessStatus =
  | "passed"
  | "passed_with_runtime_checks_pending"
  | "failed";

export interface StagingReadinessCheckResult {
  id: StagingReadinessRequirementId;
  label: string;
  outcome: StagingReadinessCheckOutcome;
  message: string;
  scope: "static" | "runtime";
  blocking: boolean;
}

export interface StagingReadinessReport {
  status: StagingReadinessStatus;
  bootstrapStatus: StagingBootstrapStatus;
  checkedAt: string;
  snapshot: StagingConfigurationSnapshot;
  checks: StagingReadinessCheckResult[];
  passedChecks: StagingReadinessCheckResult[];
  pendingRuntimeChecks: StagingReadinessCheckResult[];
  blockingChecks: StagingReadinessCheckResult[];
  alerts: string[];
  blockers: string[];
  nextSteps: string[];
}

export function buildStagingReadinessReport(input: {
  snapshot: StagingConfigurationSnapshot;
  checks: StagingReadinessCheckResult[];
  alerts?: string[];
  blockers?: string[];
  nextSteps?: string[];
}): StagingReadinessReport {
  const passedChecks = input.checks.filter((item) => item.outcome === "pass");
  const pendingRuntimeChecks = input.checks.filter(
    (item) => item.outcome === "pending_runtime",
  );
  const blockingChecks = input.checks.filter(
    (item) => item.outcome === "fail" && item.blocking,
  );

  let status: StagingReadinessStatus = "passed";

  if (blockingChecks.length > 0 || (input.blockers?.length ?? 0) > 0) {
    status = "failed";
  } else if (pendingRuntimeChecks.length > 0) {
    status = "passed_with_runtime_checks_pending";
  }

  return {
    status,
    bootstrapStatus: input.snapshot.bootstrapStatus,
    checkedAt: new Date().toISOString(),
    snapshot: input.snapshot,
    checks: input.checks,
    passedChecks,
    pendingRuntimeChecks,
    blockingChecks,
    alerts: input.alerts ?? [],
    blockers: input.blockers ?? blockingChecks.map((item) => item.message),
    nextSteps: input.nextSteps ?? [],
  };
}

export function formatStagingReadinessReport(report: StagingReadinessReport): string {
  const lines: string[] = [];

  lines.push("Douglas AI OS — Staging Readiness Check");
  lines.push(`Status: ${report.status}`);
  if (report.status === "passed_with_runtime_checks_pending") {
    lines.push(
      "Nota: checks estáticos aprovados — staging real ainda NÃO validado (runtime pendente).",
    );
  }
  lines.push(`Bootstrap: ${report.bootstrapStatus}`);
  lines.push(`Verificado em: ${report.checkedAt}`);
  lines.push(`Ambiente efetivo: ${report.snapshot.effectiveEnvironment}`);
  lines.push("");

  lines.push(`Aprovados (${report.passedChecks.length})`);
  for (const item of report.passedChecks) {
    lines.push(`  ✓ ${item.label}`);
  }
  lines.push("");

  if (report.pendingRuntimeChecks.length > 0) {
    lines.push(`Runtime pendente (${report.pendingRuntimeChecks.length})`);
    for (const item of report.pendingRuntimeChecks) {
      lines.push(`  ○ ${item.label}: ${item.message}`);
    }
    lines.push("");
  }

  if (report.blockingChecks.length > 0) {
    lines.push(`Bloqueantes (${report.blockingChecks.length})`);
    for (const item of report.blockingChecks) {
      lines.push(`  ✗ ${item.label}: ${item.message}`);
    }
    lines.push("");
  }

  if (report.nextSteps.length > 0) {
    lines.push("Próximos passos");
    for (const step of report.nextSteps) {
      lines.push(`  • ${step}`);
    }
  }

  return lines.join("\n");
}
