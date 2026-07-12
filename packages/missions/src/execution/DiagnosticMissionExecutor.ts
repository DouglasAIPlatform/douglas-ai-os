import type { OperationalAgentRuntime, OperationalSnapshotSource, ReleaseReadinessSnapshotSource } from "@douglas/agents";
import {
  OPERATIONAL_DIAGNOSTIC_REQUIRED_CAPABILITIES,
  SYSTEM_DIAGNOSTICS_AGENT_ID,
} from "@douglas/agents";
import type { MissionExecutionPlan, MissionExecutionStep } from "./MissionExecutionTypes";
import { OPERATIONAL_DIAGNOSTIC_MISSION_TYPE } from "./MissionExecutionTypes";

export interface MissionExecutorInput {
  missionId: string;
  executionId: string;
  correlationId: string;
  requestId: string;
  missionType: string;
  onProgress: (stepId: string, progress: number, label: string) => void;
  signal?: AbortSignal;
  instant?: boolean;
  snapshotSource?: OperationalSnapshotSource;
  releaseReadinessSnapshotSource?: ReleaseReadinessSnapshotSource;
}

export interface MissionExecutorResult {
  success: boolean;
  summary: string;
  errorCode?: string;
  sanitizedError?: string;
  assignedAgentId?: string;
}

export interface IMissionStepExecutor {
  readonly missionType: string;
  buildPlan(missionId: string, executionId: string): MissionExecutionPlan;
  execute(input: MissionExecutorInput): Promise<MissionExecutorResult>;
}

const DIAGNOSTIC_STEPS: MissionExecutionStep[] = [
  { id: "assign_agent", label: "Atribuir agente operacional", order: 1 },
  { id: "runtime", label: "Inspecionar runtime", order: 2 },
  { id: "health", label: "Inspecionar health engine", order: 3 },
  { id: "dependencies", label: "Inspecionar dependency graph", order: 4 },
  { id: "events", label: "Inspecionar event monitor", order: 5 },
  { id: "audit", label: "Resumir audit observability", order: 6 },
  { id: "compile_report", label: "Compilar relatório operacional", order: 7 },
];

export class DiagnosticMissionExecutor implements IMissionStepExecutor {
  readonly missionType = OPERATIONAL_DIAGNOSTIC_MISSION_TYPE;

  constructor(private readonly agentRuntime: OperationalAgentRuntime) {}

  buildPlan(missionId: string, executionId: string): MissionExecutionPlan {
    const assignment = this.agentRuntime.resolveAssignment({
      missionType: this.missionType,
      requiredCapabilities: [...OPERATIONAL_DIAGNOSTIC_REQUIRED_CAPABILITIES],
      preferredAgentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
    });

    if (assignment.decision !== "assigned" || !assignment.agentId) {
      throw new Error(assignment.reason);
    }

    return {
      executionId,
      missionId,
      steps: DIAGNOSTIC_STEPS,
      assignedAgentId: assignment.agentId,
      estimatedDurationMs: 7,
    };
  }

  async execute(input: MissionExecutorInput): Promise<MissionExecutorResult> {
    let plan: MissionExecutionPlan;

    try {
      plan = this.buildPlan(input.missionId, input.executionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Atribuição rejeitada";
      return {
        success: false,
        summary: message,
        errorCode: "AGENT_ASSIGNMENT_REJECTED",
        sanitizedError: message.slice(0, 200),
      };
    }

    if (!input.snapshotSource) {
      return {
        success: false,
        summary: "Snapshot source indisponível",
        errorCode: "SNAPSHOT_SOURCE_MISSING",
        sanitizedError: "Fonte de snapshots não configurada",
        assignedAgentId: plan.assignedAgentId,
      };
    }

    this.agentRuntime.assign(plan.assignedAgentId, input.executionId, input.correlationId);

    const agentResult = await this.agentRuntime.execute(
      {
        agentId: plan.assignedAgentId,
        executionId: input.executionId,
        correlationId: input.correlationId,
        requestId: input.requestId,
        missionId: input.missionId,
        missionType: input.missionType,
        createdBy: "mission-coordinator",
      },
      input.snapshotSource,
      {
        onProgress: input.onProgress,
        signal: input.signal,
        instant: input.instant,
      },
    );

    if (!agentResult.success) {
      return {
        success: false,
        summary: agentResult.summary,
        errorCode: agentResult.context.status === "cancelled" ? "MISSION_CANCELLED" : "AGENT_EXECUTION_FAILED",
        sanitizedError: agentResult.summary.slice(0, 200),
        assignedAgentId: plan.assignedAgentId,
      };
    }

    const report = agentResult.report;
    const summary = report
      ? `${agentResult.summary} · riscos: ${report.identifiedRisks.length}`
      : agentResult.summary;

    return {
      success: true,
      summary: summary.slice(0, 240),
      assignedAgentId: plan.assignedAgentId,
    };
  }
}

export class MissionExecutorRegistry {
  private readonly executors = new Map<string, IMissionStepExecutor>();

  register(executor: IMissionStepExecutor): void {
    this.executors.set(executor.missionType, executor);
  }

  get(missionType: string): IMissionStepExecutor | undefined {
    return this.executors.get(missionType);
  }
}

import { ReleaseReadinessMissionExecutor } from "./ReleaseReadinessMissionExecutor";

export function createDefaultMissionExecutorRegistry(
  agentRuntime: OperationalAgentRuntime,
): MissionExecutorRegistry {
  const registry = new MissionExecutorRegistry();
  registry.register(new DiagnosticMissionExecutor(agentRuntime));
  registry.register(new ReleaseReadinessMissionExecutor(agentRuntime));
  return registry;
}
