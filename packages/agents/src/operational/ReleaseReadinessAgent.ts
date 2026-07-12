import type { OperationalAgentManifest } from "./OperationalAgentTypes";
import { assertAgentExecutionSafe } from "./AgentExecutionSafetyPolicy";
import type {
  ReleaseReadinessAgentReport,
  ReleaseReadinessBlocker,
  ReleaseReadinessEvidence,
  ReleaseReadinessRecommendation,
  ReleaseReadinessVerdict,
} from "./ReleaseReadinessAgentTypes";
import {
  RELEASE_READINESS_AGENT_MANIFEST,
  RELEASE_READINESS_FORBIDDEN_ACTIONS,
} from "./ReleaseReadinessAgentTypes";
import type {
  ReleaseReadinessPlatformSnapshot,
  ReleaseReadinessSnapshotSource,
} from "./ReleaseReadinessSnapshotSource";

export interface ReleaseReadinessAgentInput {
  executionId: string;
  correlationId: string;
  missionId: string;
  onProgress?: (stepId: string, progress: number, label: string) => void;
  signal?: AbortSignal;
  instant?: boolean;
}

const EXECUTION_STEPS = [
  { id: "release", label: "Inspecionar release status", weight: 15 },
  { id: "staging", label: "Inspecionar staging readiness", weight: 15 },
  { id: "environment", label: "Inspecionar environment resolution", weight: 15 },
  { id: "safety", label: "Inspecionar production safety gate", weight: 15 },
  { id: "audit", label: "Resumir audit ingest", weight: 10 },
  { id: "persistence", label: "Inspecionar persistência de missões", weight: 10 },
  { id: "agents", label: "Inspecionar métricas de agentes", weight: 10 },
  { id: "compile", label: "Compilar recomendação de readiness", weight: 10 },
] as const;

function sanitizeMessage(value: string, max = 200): string {
  return value
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[email]")
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[token]")
    .slice(0, max);
}

export function deriveReleaseReadinessVerdict(input: {
  snapshot: ReleaseReadinessPlatformSnapshot;
  blockers: ReleaseReadinessBlocker[];
}): ReleaseReadinessVerdict {
  const { snapshot, blockers } = input;

  if (!snapshot.release || !snapshot.environment) {
    return "insufficient_data";
  }

  if (blockers.some((blocker) => blocker.severity === "critical")) {
    return "blocked";
  }

  if (snapshot.staging?.status === "failed") {
    return "blocked";
  }

  if (!snapshot.release.staticReadinessValid) {
    return "blocked";
  }

  if ((snapshot.productionSafety?.blockingCount ?? 0) > 0) {
    return "blocked";
  }

  if (snapshot.environment.hasCriticalMismatch) {
    return "blocked";
  }

  const stagingReady =
    snapshot.staging?.status === "passed" ||
    snapshot.staging?.status === "passed_with_runtime_checks_pending";

  if (!stagingReady && !snapshot.staging) {
    return "insufficient_data";
  }

  const productionReviewEligible =
    stagingReady &&
    snapshot.staging?.blockingCount === 0 &&
    (snapshot.productionSafety?.blockingCount ?? 0) === 0 &&
    snapshot.release.staticReadinessValid &&
    (snapshot.environment.canonical === "staging" ||
      snapshot.environment.canonical === "production");

  if (productionReviewEligible && snapshot.environment.canonical === "production") {
    return "ready_for_production_review";
  }

  if (stagingReady) {
    return "ready_for_staging";
  }

  return "blocked";
}

export class ReleaseReadinessAgent {
  readonly manifest: OperationalAgentManifest = RELEASE_READINESS_AGENT_MANIFEST;

  constructor(private readonly snapshotSource: ReleaseReadinessSnapshotSource) {
    assertAgentExecutionSafe({ capabilities: [...this.manifest.capabilities] });
    for (const forbidden of RELEASE_READINESS_FORBIDDEN_ACTIONS) {
      if (this.manifest.capabilities.includes(forbidden)) {
        throw new Error(`Capability proibida no manifest: ${forbidden}`);
      }
    }
  }

  async execute(input: ReleaseReadinessAgentInput): Promise<{
    success: boolean;
    summary: string;
    report: ReleaseReadinessAgentReport;
    errorCode?: string;
    sanitizedError?: string;
  }> {
    let progress = 0;

    for (const step of EXECUTION_STEPS) {
      if (input.signal?.aborted) {
        return {
          success: false,
          summary: "Revisão cancelada",
          report: this.buildCancelledReport(input),
          errorCode: "AGENT_CANCELLED",
          sanitizedError: "Operação cancelada pelo operador",
        };
      }

      progress += step.weight;
      input.onProgress?.(step.id, Math.min(progress, 100), step.label);

      if (!input.instant) {
        await Promise.resolve();
      }
    }

    const snapshot = await this.snapshotSource.collect();
    const report = this.buildReport(snapshot, input);

    const success =
      report.verdict === "ready_for_staging" ||
      report.verdict === "ready_for_production_review";

    const summary = sanitizeMessage(
      `Readiness ${report.verdict}: ${report.blockers.length} bloqueio(s), ${report.warnings.length} aviso(s), ${report.recommendations.length} recomendação(ões)`,
      240,
    );

    return { success, summary, report };
  }

  private buildReport(
    snapshot: ReleaseReadinessPlatformSnapshot,
    input: ReleaseReadinessAgentInput,
  ): ReleaseReadinessAgentReport {
    const evidence = this.collectEvidence(snapshot);
    const blockers = this.collectBlockers(snapshot);
    const warnings = this.collectWarnings(snapshot);
    const recommendations = this.collectRecommendations(snapshot, blockers);
    const verdict = deriveReleaseReadinessVerdict({ snapshot, blockers });

    return {
      verdict,
      version: snapshot.release?.version ?? "unknown",
      environment: snapshot.environment?.effectiveEnvironment ?? "unknown",
      releaseChannel: snapshot.release?.channel ?? snapshot.environment?.releaseChannel ?? "unknown",
      staticReadinessAvailable: snapshot.release?.staticReadinessValid ?? false,
      runtimeReadinessHint:
        snapshot.release?.runtimeReadinessHint ??
        "Readiness runtime completo requer Production Safety Gate e release:check (CLI).",
      stagingStatus: snapshot.staging?.status ?? "unavailable",
      blockers,
      warnings,
      evidence,
      missionPersistenceSummary: snapshot.missionPersistence
        ? sanitizeMessage(
            `Modo ${snapshot.missionPersistence.mode} · adapter ${snapshot.missionPersistence.activeAdapter}` +
              (snapshot.missionPersistence.fallbackActive ? " · fallback ativo" : ""),
          )
        : null,
      auditHealthSummary: snapshot.auditIngest
        ? sanitizeMessage(
            `${snapshot.auditIngest.accepted}/${snapshot.auditIngest.totalAttempts} aceitos · último ${snapshot.auditIngest.lastOutcome ?? "—"}`,
          )
        : null,
      agentMetricsSummary: snapshot.agentMetrics.map((metric) => ({
        agentId: metric.agentId,
        totalExecutions: metric.totalExecutions,
        successRate: metric.successRate,
      })),
      recommendations,
      readOnlyNotice:
        "Este agente apenas recomenda readiness. Não aprova produção, não executa release, deploy, tag ou migration.",
      timestamp: new Date().toISOString(),
      executionId: input.executionId,
      correlationId: input.correlationId,
    };
  }

  private collectEvidence(snapshot: ReleaseReadinessPlatformSnapshot): ReleaseReadinessEvidence[] {
    const evidence: ReleaseReadinessEvidence[] = [];

    if (snapshot.release) {
      evidence.push({
        source: "ReleaseStatusSnapshot",
        category: "release",
        summary: sanitizeMessage(
          `v${snapshot.release.version} · ${snapshot.release.releaseStatus} · static ${snapshot.release.staticReadinessValid ? "ok" : "fail"}`,
        ),
        outcome: snapshot.release.staticReadinessValid ? "pass" : "fail",
      });
    }

    if (snapshot.staging) {
      evidence.push({
        source: "StagingReadinessReport",
        category: "staging",
        summary: sanitizeMessage(
          `${snapshot.staging.status} · ${snapshot.staging.passedCount} aprovado(s) · ${snapshot.staging.blockingCount} bloqueante(s)`,
        ),
        outcome: snapshot.staging.status,
      });
    }

    if (snapshot.productionSafety) {
      evidence.push({
        source: "ProductionSafetyGate",
        category: "safety",
        summary: sanitizeMessage(
          `Gate ${snapshot.productionSafety.status} · ${snapshot.productionSafety.blockingCount} bloqueante(s)`,
        ),
        outcome: snapshot.productionSafety.status,
      });
    }

    if (snapshot.environment) {
      evidence.push({
        source: "EnvironmentResolution",
        category: "environment",
        summary: sanitizeMessage(
          `${snapshot.environment.effectiveEnvironment} · mismatch crítico: ${snapshot.environment.hasCriticalMismatch}`,
        ),
      });
    }

    if (snapshot.auditIngest) {
      evidence.push({
        source: "AuditIngestObservabilitySnapshot",
        category: "audit",
        summary: sanitizeMessage(
          `${snapshot.auditIngest.accepted} aceitos de ${snapshot.auditIngest.totalAttempts}`,
        ),
      });
    }

    if (snapshot.missionPersistence) {
      evidence.push({
        source: "MissionExecutionPersistenceHealth",
        category: "persistence",
        summary: sanitizeMessage(
          `${snapshot.missionPersistence.activeAdapter} · fallback ${snapshot.missionPersistence.fallbackActive}`,
        ),
      });
    }

    for (const metric of snapshot.agentMetrics) {
      evidence.push({
        source: "AgentExecutionMetricsSnapshot",
        category: "agents",
        summary: sanitizeMessage(
          `${metric.agentId}: ${metric.totalExecutions} exec · taxa ${metric.successRate ?? "—"}`,
        ),
      });
    }

    return evidence;
  }

  private collectBlockers(snapshot: ReleaseReadinessPlatformSnapshot): ReleaseReadinessBlocker[] {
    const blockers: ReleaseReadinessBlocker[] = [];

    if (snapshot.release && !snapshot.release.staticReadinessValid) {
      blockers.push({
        id: "release-static-invalid",
        category: "release",
        message: "Readiness estático inválido (versão ou ambiente inconsistente)",
        severity: "critical",
      });
    }

    for (const alert of snapshot.release?.alerts ?? []) {
      blockers.push({
        id: `release-alert-${blockers.length}`,
        category: "release",
        message: sanitizeMessage(alert),
        severity: "high",
      });
    }

    for (const blocker of snapshot.staging?.blockers ?? []) {
      blockers.push({
        id: `staging-blocker-${blockers.length}`,
        category: "staging",
        message: sanitizeMessage(blocker),
        severity: "critical",
      });
    }

    if ((snapshot.productionSafety?.blockingCount ?? 0) > 0) {
      blockers.push({
        id: "production-safety-blocked",
        category: "safety",
        message: "Production Safety Gate com checks bloqueantes",
        severity: "critical",
      });
    }

    if (snapshot.environment?.hasCriticalMismatch) {
      blockers.push({
        id: "environment-critical-mismatch",
        category: "environment",
        message: "Mismatch crítico na resolução de ambiente",
        severity: "critical",
      });
    }

    if (snapshot.missionPersistence?.fallbackActive && snapshot.missionPersistence.pendingSyncCount > 5) {
      blockers.push({
        id: "persistence-sync-backlog",
        category: "persistence",
        message: "Fallback de persistência com fila elevada",
        severity: "high",
      });
    }

    return blockers;
  }

  private collectWarnings(snapshot: ReleaseReadinessPlatformSnapshot): string[] {
    const warnings: string[] = [];

    for (const alert of snapshot.staging?.alerts ?? []) {
      warnings.push(sanitizeMessage(alert));
    }

    for (const warning of snapshot.environment?.warnings ?? []) {
      warnings.push(sanitizeMessage(warning));
    }

    if ((snapshot.staging?.pendingRuntimeCount ?? 0) > 0) {
      warnings.push(
        `${snapshot.staging?.pendingRuntimeCount} check(s) de staging pendente(s) em runtime`,
      );
    }

    if (snapshot.missionPersistence?.fallbackActive) {
      warnings.push("Persistência de missões em fallback sessionStorage");
    }

    if (snapshot.auditIngest && snapshot.auditIngest.failed > 0) {
      warnings.push("Falhas observadas no ingest de audit nesta sessão");
    }

    return [...new Set(warnings)];
  }

  private collectRecommendations(
    snapshot: ReleaseReadinessPlatformSnapshot,
    blockers: ReleaseReadinessBlocker[],
  ): ReleaseReadinessRecommendation[] {
    const recommendations: ReleaseReadinessRecommendation[] = [];

    if (blockers.length === 0) {
      recommendations.push({
        priority: "medium",
        message: "Readiness estático favorável — validar checks runtime antes de promover",
      });
    } else {
      recommendations.push({
        priority: "high",
        message: "Resolver bloqueios antes de considerar staging ou produção",
      });
    }

    if ((snapshot.staging?.pendingRuntimeCount ?? 0) > 0) {
      recommendations.push({
        priority: "medium",
        message: "Completar checks runtime pendentes de staging (auth, profile, audit edge)",
      });
    }

    recommendations.push({
      priority: "low",
      message:
        "Aprovação de produção permanece exclusiva de owner após revisão humana — este agente não aprova release",
    });

    if (snapshot.productionSafety?.suggestedNextSteps[0]) {
      recommendations.push({
        priority: "medium",
        message: sanitizeMessage(snapshot.productionSafety.suggestedNextSteps[0]),
      });
    }

    return recommendations;
  }

  private buildCancelledReport(input: ReleaseReadinessAgentInput): ReleaseReadinessAgentReport {
    return {
      verdict: "insufficient_data",
      version: "unknown",
      environment: "unknown",
      releaseChannel: "unknown",
      staticReadinessAvailable: false,
      runtimeReadinessHint: "cancelled",
      stagingStatus: "cancelled",
      blockers: [],
      warnings: [],
      evidence: [],
      missionPersistenceSummary: null,
      auditHealthSummary: null,
      agentMetricsSummary: [],
      recommendations: [],
      readOnlyNotice: "Execução cancelada — nenhuma recomendação emitida",
      timestamp: new Date().toISOString(),
      executionId: input.executionId,
      correlationId: input.correlationId,
    };
  }
}

export function createReleaseReadinessAgent(
  snapshotSource: ReleaseReadinessSnapshotSource,
): ReleaseReadinessAgent {
  return new ReleaseReadinessAgent(snapshotSource);
}
