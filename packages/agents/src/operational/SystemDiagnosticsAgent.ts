import type {
  AgentExecutionReport,
  AgentRuntimeStatus,
  OperationalAgentManifest,
} from "./OperationalAgentTypes";
import { SYSTEM_DIAGNOSTICS_AGENT_MANIFEST } from "./OperationalAgentTypes";
import { assertAgentExecutionSafe } from "./AgentExecutionSafetyPolicy";
import type { OperationalPlatformSnapshot, OperationalSnapshotSource } from "./OperationalSnapshotSource";

export interface SystemDiagnosticsAgentInput {
  executionId: string;
  correlationId: string;
  missionId: string;
  onProgress?: (stepId: string, progress: number, label: string) => void;
  signal?: AbortSignal;
  instant?: boolean;
}

const EXECUTION_STEPS = [
  { id: "runtime", label: "Inspecionar runtime", weight: 20 },
  { id: "health", label: "Inspecionar health engine", weight: 20 },
  { id: "dependencies", label: "Inspecionar dependency graph", weight: 20 },
  { id: "events", label: "Inspecionar event monitor", weight: 15 },
  { id: "audit", label: "Resumir audit observability", weight: 15 },
  { id: "compile", label: "Compilar relatório", weight: 10 },
] as const;

function sanitizeMessage(value: string, max = 120): string {
  return value
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[email]")
    .slice(0, max);
}

function deriveOverallStatus(snapshot: OperationalPlatformSnapshot): AgentExecutionReport["overallStatus"] {
  if (snapshot.health?.criticalCount && snapshot.health.criticalCount > 0) {
    return "critical";
  }
  if (
    (snapshot.health?.warningCount ?? 0) > 0 ||
    (snapshot.dependencies?.issueCount ?? 0) > 0 ||
    snapshot.productionSafety?.blocked
  ) {
    return "degraded";
  }
  if (snapshot.health?.status === "healthy" || snapshot.runtime?.isRunning) {
    return "healthy";
  }
  return "unknown";
}

export class SystemDiagnosticsAgent {
  readonly manifest: OperationalAgentManifest = SYSTEM_DIAGNOSTICS_AGENT_MANIFEST;

  constructor(private readonly snapshotSource: OperationalSnapshotSource) {
    assertAgentExecutionSafe({ capabilities: this.manifest.capabilities });
  }

  async execute(input: SystemDiagnosticsAgentInput): Promise<{
    success: boolean;
    summary: string;
    report: AgentExecutionReport;
    errorCode?: string;
    sanitizedError?: string;
  }> {
    let progress = 0;

    for (const step of EXECUTION_STEPS) {
      if (input.signal?.aborted) {
        return {
          success: false,
          summary: "Execução cancelada",
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

    const summary = `Diagnóstico ${report.overallStatus}: ${report.healthyModules.length} módulos saudáveis, ${report.identifiedRisks.length} riscos, ${report.recommendations.length} recomendações`;

    return {
      success: report.overallStatus !== "critical",
      summary: sanitizeMessage(summary, 240),
      report,
    };
  }

  private buildReport(
    snapshot: OperationalPlatformSnapshot,
    input: SystemDiagnosticsAgentInput,
  ): AgentExecutionReport {
    const healthyModules: string[] = [];
    const alertModules: string[] = [];
    const criticalModules: string[] = [];

    for (const module of snapshot.health?.modules ?? []) {
      if (module.status === "healthy") healthyModules.push(module.moduleName);
      else if (module.status === "critical") criticalModules.push(module.moduleName);
      else alertModules.push(module.moduleName);
    }

    for (const module of snapshot.runtime?.modules ?? []) {
      if (module.health === "healthy" && !healthyModules.includes(module.name)) {
        healthyModules.push(module.name);
      }
      if (module.health === "critical") criticalModules.push(module.name);
      if (module.health === "warning") alertModules.push(module.name);
    }

    const dependencyIssues =
      snapshot.dependencies?.issues.map((issue) =>
        sanitizeMessage(`${issue.severity}: ${issue.message}`),
      ) ?? [];

    const recentOperationalEvents =
      snapshot.events?.events
        .slice(0, 5)
        .map((event) =>
          sanitizeMessage(`${event.source}/${event.type} · ${event.message}`),
        ) ?? [];

    const identifiedRisks: string[] = [];
    if (snapshot.productionSafety?.blocked) {
      identifiedRisks.push("Production Safety Gate bloqueado");
    }
    if ((snapshot.dependencies?.criticalUnavailableCount ?? 0) > 0) {
      identifiedRisks.push("Dependências críticas indisponíveis");
    }
    if ((snapshot.health?.criticalCount ?? 0) > 0) {
      identifiedRisks.push("Módulos em estado crítico");
    }

    const recommendations: string[] = [];
    if (identifiedRisks.length === 0) {
      recommendations.push("Plataforma estável — manter monitoramento contínuo");
    } else {
      recommendations.push("Revisar módulos críticos antes de operações sensíveis");
    }
    if ((snapshot.health?.warningCount ?? 0) > 0) {
      recommendations.push("Investigar alertas de health engine");
    }
    if ((snapshot.dependencies?.issueCount ?? 0) > 0) {
      recommendations.push("Validar grafo de dependências");
    }

    return {
      overallStatus: deriveOverallStatus(snapshot),
      healthyModules: [...new Set(healthyModules)],
      alertModules: [...new Set(alertModules)],
      criticalModules: [...new Set(criticalModules)],
      dependencyIssues,
      recentOperationalEvents,
      auditState: sanitizeMessage(
        snapshot.audit?.recentSummary ?? `Audit entries: ${snapshot.audit?.totalEntries ?? 0}`,
      ),
      currentEnvironment: snapshot.environment?.environment ?? "unknown",
      readiness:
        snapshot.readinessLevel ??
        snapshot.release?.readinessStatus ??
        "unknown",
      identifiedRisks,
      recommendations,
      timestamp: new Date().toISOString(),
      executionId: input.executionId,
      correlationId: input.correlationId,
    };
  }

  private buildCancelledReport(input: SystemDiagnosticsAgentInput): AgentExecutionReport {
    return {
      overallStatus: "unknown",
      healthyModules: [],
      alertModules: [],
      criticalModules: [],
      dependencyIssues: [],
      recentOperationalEvents: [],
      auditState: "cancelled",
      currentEnvironment: "unknown",
      readiness: "unknown",
      identifiedRisks: [],
      recommendations: [],
      timestamp: new Date().toISOString(),
      executionId: input.executionId,
      correlationId: input.correlationId,
    };
  }
}

export function createSystemDiagnosticsAgent(
  snapshotSource: OperationalSnapshotSource,
): SystemDiagnosticsAgent {
  return new SystemDiagnosticsAgent(snapshotSource);
}

export type { AgentRuntimeStatus };
