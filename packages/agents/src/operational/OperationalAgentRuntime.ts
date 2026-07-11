import type {
  AgentExecutionContext,
  AgentExecutionReport,
  AgentExecutionRequest,
  AgentExecutionResult,
  AgentRuntimeStatus,
  AgentSessionMetrics,
  OperationalAgentManifest,
} from "./OperationalAgentTypes";
import { SYSTEM_DIAGNOSTICS_AGENT_ID, SYSTEM_DIAGNOSTICS_AGENT_MANIFEST } from "./OperationalAgentTypes";
import {
  AgentCapabilityMatcher,
  type AgentCapabilityMatchInput,
  type AgentCapabilityMatchResult,
} from "./AgentCapabilityMatcher";
import { createSystemDiagnosticsAgent } from "./SystemDiagnosticsAgent";
import type { OperationalSnapshotSource } from "./OperationalSnapshotSource";

export class AgentSessionMetricsStore {
  private readonly byAgent = new Map<string, AgentSessionMetrics>();

  get(agentId: string): AgentSessionMetrics {
    return (
      this.byAgent.get(agentId) ?? {
        executions: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        averageDurationMs: 0,
      }
    );
  }

  record(
    agentId: string,
    outcome: "completed" | "failed" | "cancelled",
    durationMs: number,
  ): AgentSessionMetrics {
    const current = this.get(agentId);
    const executions = current.executions + 1;
    const completed = current.completed + (outcome === "completed" ? 1 : 0);
    const failed = current.failed + (outcome === "failed" ? 1 : 0);
    const cancelled = current.cancelled + (outcome === "cancelled" ? 1 : 0);
    const averageDurationMs = Math.round(
      (current.averageDurationMs * current.executions + durationMs) / executions,
    );

    const next: AgentSessionMetrics = {
      executions,
      completed,
      failed,
      cancelled,
      averageDurationMs,
      lastExecutionAt: new Date().toISOString(),
      lastOutcome: outcome,
    };

    this.byAgent.set(agentId, next);
    return next;
  }
}

export type OperationalAgentEventPublisher = (
  topic:
    | "agent:registered"
    | "agent:assigned"
    | "agent:execution_started"
    | "agent:progress"
    | "agent:execution_completed"
    | "agent:execution_failed"
    | "agent:execution_cancelled"
    | "agent:assignment_rejected",
  payload: Record<string, unknown>,
) => void;

export class OperationalAgentRegistry {
  private readonly manifests = new Map<string, OperationalAgentManifest>();
  private readonly runtimeStatus = new Map<string, AgentRuntimeStatus>();
  private readonly lastReports = new Map<string, AgentExecutionReport>();

  constructor(initial: OperationalAgentManifest[] = [SYSTEM_DIAGNOSTICS_AGENT_MANIFEST]) {
    for (const manifest of initial) {
      this.register(manifest);
    }
  }

  register(manifest: OperationalAgentManifest, publish?: OperationalAgentEventPublisher): void {
    this.manifests.set(manifest.id, manifest);
    this.runtimeStatus.set(manifest.id, "idle");
    publish?.("agent:registered", {
      agentId: manifest.id,
      name: manifest.name,
      version: manifest.version,
      readOnly: manifest.readOnly,
      audited: true,
    });
  }

  list(): OperationalAgentManifest[] {
    return [...this.manifests.values()];
  }

  get(agentId: string): OperationalAgentManifest | undefined {
    return this.manifests.get(agentId);
  }

  getStatus(agentId: string): AgentRuntimeStatus {
    return this.runtimeStatus.get(agentId) ?? "unavailable";
  }

  setStatus(agentId: string, status: AgentRuntimeStatus): void {
    this.runtimeStatus.set(agentId, status);
  }

  storeReport(agentId: string, report: AgentExecutionReport): void {
    this.lastReports.set(agentId, report);
  }

  getLastReport(agentId: string): AgentExecutionReport | undefined {
    return this.lastReports.get(agentId);
  }
}

export class OperationalAgentRuntime {
  private readonly registry: OperationalAgentRegistry;
  private readonly metrics: AgentSessionMetricsStore;
  private readonly matcher: AgentCapabilityMatcher;
  private readonly publish?: OperationalAgentEventPublisher;
  private readonly activeExecutions = new Map<string, AbortController>();

  constructor(options?: {
    registry?: OperationalAgentRegistry;
    metrics?: AgentSessionMetricsStore;
    publish?: OperationalAgentEventPublisher;
  }) {
    this.publish = options?.publish;
    this.registry = options?.registry ?? new OperationalAgentRegistry();
    if (!options?.registry) {
      for (const manifest of this.registry.list()) {
        this.publish?.("agent:registered", {
          agentId: manifest.id,
          name: manifest.name,
          version: manifest.version,
          readOnly: manifest.readOnly,
          audited: true,
        });
      }
    }
    this.metrics = options?.metrics ?? new AgentSessionMetricsStore();
    this.matcher = new AgentCapabilityMatcher(
      this.registry.list(),
      (agentId) => this.registry.getStatus(agentId),
    );
  }

  getRegistry(): OperationalAgentRegistry {
    return this.registry;
  }

  getMetrics(agentId: string): AgentSessionMetrics {
    return this.metrics.get(agentId);
  }

  resolveAssignment(input: AgentCapabilityMatchInput): AgentCapabilityMatchResult {
    const result = this.matcher.match(input);

    if (result.decision !== "assigned") {
      this.publish?.("agent:assignment_rejected", {
        missionType: input.missionType,
        reason: result.reason,
        decision: result.decision,
        audited: true,
      });
    }

    return result;
  }

  async execute(
    request: AgentExecutionRequest,
    snapshotSource: OperationalSnapshotSource,
    options?: {
      onProgress?: (stepId: string, progress: number, label: string) => void;
      signal?: AbortSignal;
      instant?: boolean;
    },
  ): Promise<AgentExecutionResult> {
    const manifest = this.registry.get(request.agentId);
    if (!manifest) {
      return this.fail(request, "AGENT_NOT_FOUND", "Agente não registrado");
    }

    if (manifest.id !== SYSTEM_DIAGNOSTICS_AGENT_ID) {
      return this.fail(request, "AGENT_UNSUPPORTED", "Agente não suportado nesta sprint");
    }

    const startedAt = Date.now();
    const context: AgentExecutionContext = {
      request,
      status: "running",
      assignedAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      progress: 0,
    };

    this.registry.setStatus(request.agentId, "running");
    this.publish?.("agent:execution_started", {
      agentId: request.agentId,
      executionId: request.executionId,
      correlationId: request.correlationId,
      missionId: request.missionId,
      audited: true,
    });

    const controller = new AbortController();
    this.activeExecutions.set(request.executionId, controller);
    options?.signal?.addEventListener("abort", () => controller.abort());

    const agent = createSystemDiagnosticsAgent(snapshotSource);
    const outcome = await agent.execute({
      executionId: request.executionId,
      correlationId: request.correlationId,
      missionId: request.missionId,
      onProgress: (stepId, progress, label) => {
        context.progress = progress;
        context.currentStep = stepId;
        this.publish?.("agent:progress", {
          agentId: request.agentId,
          executionId: request.executionId,
          correlationId: request.correlationId,
          progress,
          currentStep: stepId,
          summary: label,
          audited: true,
        });
        options?.onProgress?.(stepId, progress, label);
      },
      signal: controller.signal,
      instant: options?.instant,
    });

    this.activeExecutions.delete(request.executionId);
    const durationMs = Date.now() - startedAt;
    context.durationMs = durationMs;
    context.completedAt = new Date().toISOString();

    if (!outcome.success) {
      const isCancelled = outcome.errorCode === "AGENT_CANCELLED";
      context.status = isCancelled ? "cancelled" : "failed";
      this.registry.setStatus(request.agentId, "idle");
      this.metrics.record(
        request.agentId,
        isCancelled ? "cancelled" : "failed",
        durationMs,
      );
      this.publish?.(
        isCancelled ? "agent:execution_cancelled" : "agent:execution_failed",
        {
          agentId: request.agentId,
          executionId: request.executionId,
          correlationId: request.correlationId,
          errorCode: outcome.errorCode,
          summary: outcome.sanitizedError ?? outcome.summary,
          audited: true,
        },
      );

      return {
        context,
        success: false,
        summary: outcome.sanitizedError ?? outcome.summary,
        report: outcome.report,
      };
    }

    context.status = "completed";
    context.progress = 100;
    this.registry.setStatus(request.agentId, "idle");
    this.registry.storeReport(request.agentId, outcome.report);
    this.metrics.record(request.agentId, "completed", durationMs);

    this.publish?.("agent:execution_completed", {
      agentId: request.agentId,
      executionId: request.executionId,
      correlationId: request.correlationId,
      summary: outcome.summary.slice(0, 240),
      overallStatus: outcome.report.overallStatus,
      audited: true,
    });

    return {
      context,
      success: true,
      summary: outcome.summary,
      report: outcome.report,
    };
  }

  assign(agentId: string, executionId: string, correlationId: string): void {
    this.registry.setStatus(agentId, "assigned");
    this.publish?.("agent:assigned", {
      agentId,
      executionId,
      correlationId,
      audited: true,
    });
  }

  cancel(executionId: string): void {
    this.activeExecutions.get(executionId)?.abort();
  }

  private fail(
    request: AgentExecutionRequest,
    errorCode: string,
    message: string,
  ): AgentExecutionResult {
    const context: AgentExecutionContext = {
      request,
      status: "failed",
      progress: 0,
      completedAt: new Date().toISOString(),
    };

    this.registry.setStatus(request.agentId, "idle");
    this.publish?.("agent:execution_failed", {
      agentId: request.agentId,
      executionId: request.executionId,
      correlationId: request.correlationId,
      errorCode,
      summary: message,
      audited: true,
    });

    return {
      context,
      success: false,
      summary: message,
    };
  }
}
