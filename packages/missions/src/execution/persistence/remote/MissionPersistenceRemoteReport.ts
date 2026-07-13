import type { MissionPersistenceRemoteCheck } from "./MissionPersistenceRemoteCheck";
import type { MissionPersistenceRemoteCheckStatus } from "./MissionPersistenceRemoteCheck";

export interface MissionPersistenceRemoteEvidence {
  id: string;
  label: string;
  summary: string;
}

export interface MissionPersistenceRemoteReport {
  status: MissionPersistenceRemoteCheckStatus;
  environment: string;
  configuredMode: string;
  effectiveAdapter: string;
  checks: MissionPersistenceRemoteCheck[];
  evidence: MissionPersistenceRemoteEvidence[];
  passedCount: number;
  failedCount: number;
  warningCount: number;
  blockedCount: number;
  startedAt: string;
  completedAt: string | null;
  summary: string;
}

export function resolveRemoteReportStatus(
  checks: MissionPersistenceRemoteCheck[],
): MissionPersistenceRemoteCheckStatus {
  if (checks.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (checks.some((item) => item.status === "failed" && item.blocking)) {
    return "failed";
  }
  if (checks.some((item) => item.status === "warning")) {
    return "warning";
  }
  if (checks.every((item) => item.status === "passed" || item.status === "pending")) {
    return checks.some((item) => item.status === "pending") ? "pending" : "passed";
  }
  if (checks.every((item) => item.status === "unknown")) {
    return "unknown";
  }
  return "failed";
}

export function buildMissionPersistenceRemoteReport(input: {
  environment: string;
  configuredMode: string;
  effectiveAdapter: string;
  checks: MissionPersistenceRemoteCheck[];
  evidence?: MissionPersistenceRemoteEvidence[];
  startedAt: string;
  completedAt?: string | null;
  summary?: string;
}): MissionPersistenceRemoteReport {
  const passedCount = input.checks.filter((item) => item.status === "passed").length;
  const failedCount = input.checks.filter((item) => item.status === "failed").length;
  const warningCount = input.checks.filter((item) => item.status === "warning").length;
  const blockedCount = input.checks.filter((item) => item.status === "blocked").length;
  const status = resolveRemoteReportStatus(input.checks);

  return {
    status,
    environment: input.environment,
    configuredMode: input.configuredMode,
    effectiveAdapter: input.effectiveAdapter,
    checks: input.checks,
    evidence: input.evidence ?? [],
    passedCount,
    failedCount,
    warningCount,
    blockedCount,
    startedAt: input.startedAt,
    completedAt: input.completedAt ?? null,
    summary:
      input.summary
      ?? (status === "passed"
        ? "Persistência remota confirmada nos cenários de acceptance."
        : status === "unknown"
          ? "Validação remota ainda não executada."
          : "Validação remota incompleta ou com falhas."),
  };
}

export function formatMissionPersistenceRemoteReport(report: MissionPersistenceRemoteReport): string {
  const lines = [
    "Mission Persistence — Remote Validation",
    `Status: ${report.status}`,
    `Ambiente: ${report.environment} · Modo: ${report.configuredMode} · Adapter: ${report.effectiveAdapter}`,
    `Checks: ${report.passedCount} ok · ${report.failedCount} fail · ${report.warningCount} warn · ${report.blockedCount} blocked`,
    "",
  ];

  for (const check of report.checks) {
    lines.push(`  [${check.status}] ${check.label}: ${check.message}`);
  }

  if (report.evidence.length > 0) {
    lines.push("", "Evidências:");
    for (const item of report.evidence) {
      lines.push(`  · ${item.label}: ${item.summary}`);
    }
  }

  lines.push("", report.summary);
  return lines.join("\n");
}
