import type { OperationalAgentRuntime, OperationalSnapshotSource } from "@douglas/agents";
import { OperationalAgentRuntime as DefaultOperationalAgentRuntime } from "@douglas/agents";
import type { EventTopic } from "@douglas/events";
import { buildMissionLifecyclePayload } from "@douglas/events";
import type { MissionManager } from "../MissionManager";
import {
  canPerformMissionExecution,
  missionExecutionAccessReason,
} from "./MissionExecutionAccessPolicy";
import {
  createDefaultMissionExecutorRegistry,
  type MissionExecutorRegistry,
} from "./DiagnosticMissionExecutor";
import {
  MissionExecutionIdempotencyGuard,
  MissionExecutionRegistry,
  type MissionExecutionDuplicateDecision,
} from "./MissionExecutionIdempotency";
import {
  CompositeMissionExecutionPersistence,
  InMemoryMissionExecutionPersistence,
  type MissionExecutionPersistenceAdapter,
} from "./MissionExecutionPersistenceAdapter";
import { mapExecutionStatusToMissionStatus } from "./MissionExecutionStatusMapper";
import type {
  MissionExecutionContext,
  MissionExecutionRequest,
  MissionExecutionResult,
  MissionExecutionStatus,
  MissionOperatorRole,
} from "./MissionExecutionTypes";
import {
  OPERATIONAL_DIAGNOSTIC_AGENT_ID,
  OPERATIONAL_DIAGNOSTIC_MISSION_TITLE,
  OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
} from "./MissionExecutionTypes";

export interface MissionExecutionAuditEntry {
  action: string;
  message: string;
  metadata: Record<string, unknown>;
}

export interface MissionExecutionCoordinatorOptions {
  manager: MissionManager;
  persistence?: MissionExecutionPersistenceAdapter;
  registry?: MissionExecutionRegistry;
  idempotency?: MissionExecutionIdempotencyGuard;
  executors?: MissionExecutorRegistry;
  agentRuntime?: OperationalAgentRuntime;
  snapshotSource?: OperationalSnapshotSource;
  publishEvent?: (
    topic: EventTopic,
    payload: ReturnType<typeof buildMissionLifecyclePayload>,
  ) => void;
  appendAudit?: (entry: MissionExecutionAuditEntry) => void;
}

const VALID_TRANSITIONS: Record<MissionExecutionStatus, MissionExecutionStatus[]> = {
  created: ["validated", "failed", "cancelled"],
  validated: ["planned", "failed", "cancelled"],
  planned: ["assigned", "failed", "cancelled"],
  assigned: ["running", "failed", "cancelled"],
  running: ["completed", "failed", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
};

function sanitizeActorId(createdBy: string): string {
  if (createdBy.length <= 8) return createdBy;
  return `${createdBy.slice(0, 4)}…${createdBy.slice(-2)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export class MissionExecutionCoordinator {
  private readonly manager: MissionManager;
  private readonly persistence: MissionExecutionPersistenceAdapter;
  private readonly registry: MissionExecutionRegistry;
  private readonly idempotency: MissionExecutionIdempotencyGuard;
  private readonly executors: MissionExecutorRegistry;
  private readonly agentRuntime?: OperationalAgentRuntime;
  private readonly snapshotSource?: OperationalSnapshotSource;
  private readonly publishEvent?: MissionExecutionCoordinatorOptions["publishEvent"];
  private readonly appendAudit?: MissionExecutionCoordinatorOptions["appendAudit"];
  private readonly abortControllers = new Map<string, AbortController>();

  constructor(options: MissionExecutionCoordinatorOptions) {
    this.manager = options.manager;
    this.registry = options.registry ?? new MissionExecutionRegistry();
    this.idempotency =
      options.idempotency ?? new MissionExecutionIdempotencyGuard(this.registry);
    this.persistence =
      options.persistence ??
      new CompositeMissionExecutionPersistence([new InMemoryMissionExecutionPersistence()]);
    if (options.executors) {
      this.executors = options.executors;
    } else {
      const runtime = options.agentRuntime ?? new DefaultOperationalAgentRuntime();
      this.agentRuntime = runtime;
      this.executors = createDefaultMissionExecutorRegistry(runtime);
    }
    this.agentRuntime = options.agentRuntime ?? this.agentRuntime;
    this.snapshotSource = options.snapshotSource;
    this.publishEvent = options.publishEvent;
    this.appendAudit = options.appendAudit;
  }

  getRegistry(): MissionExecutionRegistry {
    return this.registry;
  }

  getContext(executionId: string): MissionExecutionContext | undefined {
    return this.registry.getByExecutionId(executionId);
  }

  listExecutions(): MissionExecutionContext[] {
    return this.registry.list();
  }

  createDiagnosticRequest(input: {
    executionId: string;
    correlationId: string;
    requestId: string;
    createdBy: string;
    createdByRole: string;
    missionId?: string;
    isRetry?: boolean;
    previousExecutionId?: string;
  }): MissionExecutionRequest {
    return {
      executionId: input.executionId,
      correlationId: input.correlationId,
      requestId: input.requestId,
      createdBy: sanitizeActorId(input.createdBy),
      createdByRole: input.createdByRole,
      missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
      title: OPERATIONAL_DIAGNOSTIC_MISSION_TITLE,
      description: "Diagnóstico determinístico da plataforma — sem IA externa.",
      missionId: input.missionId,
      isRetry: input.isRetry,
      previousExecutionId: input.previousExecutionId,
    };
  }

  async execute(
    request: MissionExecutionRequest,
    options?: { instant?: boolean },
  ): Promise<MissionExecutionResult> {
    if (
      !canPerformMissionExecution({
        role: request.createdByRole as MissionOperatorRole,
        missionType: request.missionType,
        capability: request.isRetry ? "retry" : "execute",
      })
    ) {
      const deniedContext: MissionExecutionContext = {
        request,
        status: "failed",
        missionId: request.missionId ?? "denied",
        executionId: request.executionId,
        correlationId: request.correlationId,
        requestId: request.requestId,
        createdBy: request.createdBy,
        progress: 0,
        attempt: 1,
        sanitizedError: missionExecutionAccessReason({
          role: request.createdByRole as MissionOperatorRole,
          missionType: request.missionType,
          capability: "execute",
        }),
      };

      return {
        context: deniedContext,
        success: false,
        summary: deniedContext.sanitizedError ?? "Acesso negado",
      };
    }

    const missionId =
      request.missionId ??
      (() => {
        const created = this.manager.create({
          title: request.title,
          description: request.description ?? "",
          priority: "normal",
          execution: {
            mode: "manual",
            executorId: OPERATIONAL_DIAGNOSTIC_AGENT_ID,
          },
          metadata: { missionType: request.missionType },
        });
        this.manager.transition(created.id, "planned");
        return created.id;
      })();

    const duplicateDecision = this.idempotency.evaluate({
      executionId: request.executionId,
      missionId,
      isRetry: request.isRetry,
    });

    if (duplicateDecision === "reject_same_execution") {
      const previous = this.registry.getResult(request.executionId);
      if (previous) {
        return previous;
      }
    }

    if (duplicateDecision === "reject_running_mission") {
      return this.handleDuplicate(request, missionId, duplicateDecision);
    }

    const previous = this.registry.getResult(request.executionId);
    const previousAttempt = request.previousExecutionId
      ? this.registry.getByExecutionId(request.previousExecutionId)?.attempt
      : undefined;

    if (previous && !request.isRetry && duplicateDecision !== "allow_retry") {
      return previous;
    }

    let context = this.bootstrapContext(request, missionId);
    context.attempt = request.isRetry ? (previousAttempt ?? previous?.context.attempt ?? 0) + 1 : 1;
    this.registry.register(context);
    await this.persistence.save(context);
    this.emit("mission:created", context);

    try {
      await this.validateMission(context);
      context = await this.transition(context, "validated", "mission:validated");

      const executor = this.executors.get(request.missionType);
      if (!executor) {
        return this.failContext(context, "EXECUTOR_NOT_FOUND", "Executor não disponível para este tipo");
      }

      let plan;
      try {
        plan = executor.buildPlan(missionId, request.executionId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Atribuição de agente falhou";
        return this.failContext(context, "AGENT_ASSIGNMENT_REJECTED", message);
      }

      context.plan = plan;
      context = await this.transition(context, "planned", "mission:planned");

      context.assignedAgentId = plan.assignedAgentId;
      context = await this.transition(context, "assigned", "mission:assigned");
      this.syncMissionBoard(context);

      context = await this.transition(context, "running", "mission:started");
      context.startedAt = nowIso();
      this.manager.start(missionId);
      this.syncMissionBoard(context);

      const abortController = new AbortController();
      this.abortControllers.set(request.executionId, abortController);

      const executorResult = await executor.execute({
        missionId,
        executionId: request.executionId,
        correlationId: request.correlationId,
        requestId: request.requestId,
        missionType: request.missionType,
        signal: abortController.signal,
        instant: options?.instant,
        snapshotSource: this.snapshotSource,
        onProgress: (stepId, progress, label) => {
          context.currentStep = stepId;
          context.progress = progress;
          this.registry.update(context);
          void this.persistence.save(context);
          this.manager.updateProgress(missionId, { percent: progress, currentStep: stepId });
          this.manager.getTimeline().record(
            missionId,
            "progress_update",
            label,
            `${progress}%`,
          );
          this.emit("mission:progress", context, { summary: label });
        },
      });

      this.abortControllers.delete(request.executionId);

      if (!executorResult.success) {
        if (executorResult.errorCode === "MISSION_CANCELLED") {
          return this.cancelContext(context, executorResult.sanitizedError ?? "Cancelada");
        }
        return this.failContext(
          context,
          executorResult.errorCode ?? "EXECUTION_FAILED",
          executorResult.sanitizedError ?? "Falha na execução",
        );
      }

      context.resultSummary = executorResult.summary;
      context.progress = 100;
      context.completedAt = nowIso();
      context = await this.transition(context, "completed", "mission:completed", {
        summary: executorResult.summary,
      });
      this.manager.complete(missionId);
      this.syncMissionBoard(context);

      const result: MissionExecutionResult = {
        context,
        success: true,
        summary: executorResult.summary,
      };
      this.registry.storeResult(result);
      await this.persistence.saveResult(result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return this.failContext(context!, "UNEXPECTED_ERROR", message.slice(0, 200));
    }
  }

  async cancel(executionId: string, actorRole: string): Promise<MissionExecutionResult | undefined> {
    const context = this.registry.getByExecutionId(executionId);
    if (!context) return undefined;

    if (
      !canPerformMissionExecution({
        role: actorRole as MissionOperatorRole,
        missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
        capability: "cancel",
      })
    ) {
      return this.failContext(context, "ACCESS_DENIED", "Cancelamento não permitido para este role");
    }

    if (context.status === "completed" || context.status === "failed" || context.status === "cancelled") {
      return this.registry.getResult(executionId);
    }

    const controller = this.abortControllers.get(executionId);
    controller?.abort();
    this.agentRuntime?.cancel(executionId);

    return this.cancelContext(context, "Cancelada pelo operador");
  }

  private bootstrapContext(
    request: MissionExecutionRequest,
    missionId: string,
  ): MissionExecutionContext {
    return {
      request,
      status: "created",
      missionId,
      executionId: request.executionId,
      correlationId: request.correlationId,
      requestId: request.requestId,
      createdBy: request.createdBy,
      progress: 0,
      attempt: 1,
    };
  }

  private async validateMission(context: MissionExecutionContext): Promise<MissionExecutionContext> {
    const mission = this.manager.get(context.missionId);
    if (!mission) {
      throw new Error("Missão não encontrada");
    }
    if (mission.metadata?.missionType && mission.metadata.missionType !== context.request.missionType) {
      throw new Error("Tipo de missão incompatível");
    }
    return context;
  }

  private assertTransition(from: MissionExecutionStatus, to: MissionExecutionStatus): void {
    const allowed = VALID_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new Error(`Transição inválida: ${from} → ${to}`);
    }
  }

  private async transition(
    context: MissionExecutionContext,
    nextStatus: MissionExecutionStatus,
    topic: EventTopic,
    extra?: { summary?: string; errorCode?: string },
  ): Promise<MissionExecutionContext> {
    this.assertTransition(context.status, nextStatus);
    const next: MissionExecutionContext = { ...context, status: nextStatus };
    this.registry.update(next);
    await this.persistence.save(next);
    this.emit(topic, next, extra);
    return next;
  }

  private emit(
    topic: EventTopic,
    context: MissionExecutionContext,
    extra?: { summary?: string; errorCode?: string },
  ): void {
    const payload = buildMissionLifecyclePayload({
      missionId: context.missionId,
      executionId: context.executionId,
      correlationId: context.correlationId,
      status: context.status,
      currentStep: context.currentStep,
      progress: context.progress,
      assignedAgentId: context.assignedAgentId ?? OPERATIONAL_DIAGNOSTIC_AGENT_ID,
      summary: extra?.summary ?? context.resultSummary,
      errorCode: extra?.errorCode,
      audited: true,
    });

    this.publishEvent?.(topic, payload);
    this.recordAudit(topic, context, extra);
    this.manager
      .getTimeline()
      .record(context.missionId, "note", topic, extra?.summary ?? context.status);
  }

  private recordAudit(
    topic: EventTopic,
    context: MissionExecutionContext,
    extra?: { summary?: string; errorCode?: string },
  ): void {
    this.appendAudit?.({
      action: topic.replace("mission:", "mission_"),
      message: extra?.summary ?? `Missão ${context.status}`,
      metadata: {
        missionId: context.missionId,
        executionId: context.executionId,
        correlationId: context.correlationId,
        status: context.status,
        progress: context.progress,
        ...(extra?.errorCode ? { errorCode: extra.errorCode } : {}),
        origin: "mission_execution_coordinator",
      },
    });
  }

  private syncMissionBoard(context: MissionExecutionContext): void {
    const boardStatus = mapExecutionStatusToMissionStatus(context.status);
    this.manager.transition(context.missionId, boardStatus);
  }

  private async failContext(
    context: MissionExecutionContext,
    errorCode: string,
    message: string,
  ): Promise<MissionExecutionResult> {
    const sanitized = message.slice(0, 200);
    let failed = context;

    if (failed.status !== "failed") {
      try {
        if (VALID_TRANSITIONS[failed.status].includes("failed")) {
          failed = await this.transition(failed, "failed", "mission:failed", {
            errorCode,
            summary: sanitized,
          });
        } else {
          failed = { ...failed, status: "failed", sanitizedError: sanitized };
          this.registry.update(failed);
          await this.persistence.save(failed);
          this.emit("mission:failed", failed, { errorCode, summary: sanitized });
        }
      } catch {
        failed = { ...failed, status: "failed", sanitizedError: sanitized };
        this.registry.update(failed);
        await this.persistence.save(failed);
        this.emit("mission:failed", failed, { errorCode, summary: sanitized });
      }
    }

    failed.sanitizedError = sanitized;
    failed.completedAt = nowIso();
    this.manager.block(failed.missionId, sanitized);
    this.syncMissionBoard(failed);

    const result: MissionExecutionResult = {
      context: failed,
      success: false,
      summary: sanitized,
    };
    this.registry.storeResult(result);
    await this.persistence.saveResult(result);
    return result;
  }

  private async cancelContext(
    context: MissionExecutionContext,
    reason: string,
  ): Promise<MissionExecutionResult> {
    let cancelled = context;
    if (VALID_TRANSITIONS[cancelled.status].includes("cancelled")) {
      cancelled = await this.transition(cancelled, "cancelled", "mission:cancelled", {
        summary: reason,
      });
    } else {
      cancelled = { ...cancelled, status: "cancelled" };
      this.registry.update(cancelled);
      await this.persistence.save(cancelled);
      this.emit("mission:cancelled", cancelled, { summary: reason });
    }

    cancelled.completedAt = nowIso();
    this.manager.block(cancelled.missionId, reason);
    this.syncMissionBoard(cancelled);

    const result: MissionExecutionResult = {
      context: cancelled,
      success: false,
      summary: reason,
    };
    this.registry.storeResult(result);
    await this.persistence.saveResult(result);
    return result;
  }

  private async handleDuplicate(
    request: MissionExecutionRequest,
    missionId: string,
    decision: MissionExecutionDuplicateDecision,
  ): Promise<MissionExecutionResult> {
    const context = this.bootstrapContext(request, missionId);
    context.status = "failed";
    context.sanitizedError =
      decision === "reject_same_execution"
        ? "Execução duplicada rejeitada (mesmo executionId)"
        : "Missão já em execução";

    this.emit("mission:duplicate_rejected", context, {
      errorCode: decision,
      summary: context.sanitizedError,
    });

    const result: MissionExecutionResult = {
      context,
      success: false,
      summary: context.sanitizedError,
    };
    this.registry.storeResult(result);
    await this.persistence.saveResult(result);
    return result;
  }
}

export { VALID_TRANSITIONS as MISSION_EXECUTION_VALID_TRANSITIONS };
