import type { StagingBootstrapStatus } from "./StagingBootstrapStatus";
import type { StagingConfigurationSnapshot } from "./StagingConfigurationSnapshot";
import type { StagingReadinessDimensions } from "./StagingReadinessDimensions";
import type { StagingReadinessRequirementId } from "./StagingReadinessRequirement";
import type { StagingTargetStatus } from "./StagingTargetManifest";
import type { StagingSafetyCheck } from "./StagingSafetyGate";

function stagingTargetStatusLabel(status: StagingTargetStatus): string {
  const labels: Record<StagingTargetStatus, string> = {
    not_started: "Não iniciado",
    configuration_prepared: "Codebase preparada",
    remote_project_pending: "Projeto remoto pendente",
    remote_link_pending: "Supabase CLI link pendente",
    migrations_pending: "Migrations pendentes",
    edge_function_pending: "Edge Function pendente",
    runtime_validation_pending: "Validação runtime pendente",
    ready: "Pronto para uso",
  };
  return labels[status];
}

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
  /** Sprint 5.53 — dimensões explícitas do bootstrap. */
  dimensions: StagingReadinessDimensions;
  finalStatus: StagingTargetStatus;
  finalStatusLabel: string;
  checkedAt: string;
  snapshot: StagingConfigurationSnapshot;
  checks: StagingReadinessCheckResult[];
  passedChecks: StagingReadinessCheckResult[];
  pendingRuntimeChecks: StagingReadinessCheckResult[];
  blockingChecks: StagingReadinessCheckResult[];
  alerts: string[];
  blockers: string[];
  nextSteps: string[];
  /** Checks de política staging — Sprint 5.53. */
  safetyChecks?: StagingSafetyCheck[];
}

export function buildStagingReadinessReport(input: {
  snapshot: StagingConfigurationSnapshot;
  checks: StagingReadinessCheckResult[];
  dimensions: StagingReadinessDimensions;
  alerts?: string[];
  blockers?: string[];
  nextSteps?: string[];
  safetyChecks?: StagingSafetyCheck[];
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
    dimensions: input.dimensions,
    finalStatus: input.dimensions.finalStatus,
    finalStatusLabel: stagingTargetStatusLabel(input.dimensions.finalStatus),
    checkedAt: new Date().toISOString(),
    snapshot: input.snapshot,
    checks: input.checks,
    passedChecks,
    pendingRuntimeChecks,
    blockingChecks,
    alerts: input.alerts ?? [],
    blockers: input.blockers ?? blockingChecks.map((item) => item.message),
    nextSteps: input.nextSteps ?? [],
    safetyChecks: input.safetyChecks,
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
  lines.push(`Final status: ${report.finalStatus} (${report.finalStatusLabel})`);
  lines.push(
    `Dimensões: codebase=${report.dimensions.codebasePrepared} local=${report.dimensions.localConfigurationPrepared} remoto=${report.dimensions.remoteProjectConfigured} runtime=${report.dimensions.runtimeValidated}`,
  );
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
