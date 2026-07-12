import type { OperationalAgentRuntime, ReleaseReadinessSnapshotSource } from "@douglas/agents";
import {
  RELEASE_READINESS_AGENT_ID,
  RELEASE_READINESS_REQUIRED_CAPABILITIES,
  RELEASE_READINESS_REVIEW_MISSION_TYPE,
} from "@douglas/agents";
import type { MissionExecutionPlan, MissionExecutionStep } from "./MissionExecutionTypes";
import type {
  IMissionStepExecutor,
  MissionExecutorInput,
  MissionExecutorResult,
} from "./DiagnosticMissionExecutor";

const RELEASE_READINESS_STEPS: MissionExecutionStep[] = [
  { id: "assign_agent", label: "Atribuir Release Readiness Agent", order: 1 },
  { id: "release", label: "Inspecionar release status", order: 2 },
  { id: "staging", label: "Inspecionar staging readiness", order: 3 },
  { id: "environment", label: "Inspecionar environment resolution", order: 4 },
  { id: "safety", label: "Inspecionar production safety gate", order: 5 },
  { id: "audit", label: "Resumir audit ingest", order: 6 },
  { id: "persistence", label: "Inspecionar persistência de missões", order: 7 },
  { id: "agents", label: "Inspecionar métricas de agentes", order: 8 },
  { id: "compile_report", label: "Compilar recomendação de readiness", order: 9 },
];

export class ReleaseReadinessMissionExecutor implements IMissionStepExecutor {
  readonly missionType = RELEASE_READINESS_REVIEW_MISSION_TYPE;

  constructor(private readonly agentRuntime: OperationalAgentRuntime) {}

  buildPlan(missionId: string, executionId: string): MissionExecutionPlan {
    const assignment = this.agentRuntime.resolveAssignment({
      missionType: this.missionType,
      requiredCapabilities: [...RELEASE_READINESS_REQUIRED_CAPABILITIES],
      preferredAgentId: RELEASE_READINESS_AGENT_ID,
    });

    if (assignment.decision !== "assigned" || !assignment.agentId) {
      throw new Error(assignment.reason);
    }

    return {
      executionId,
      missionId,
      steps: RELEASE_READINESS_STEPS,
      assignedAgentId: assignment.agentId,
      estimatedDurationMs: 9,
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

    if (!input.releaseReadinessSnapshotSource) {
      return {
        success: false,
        summary: "Snapshot source de readiness indisponível",
        errorCode: "SNAPSHOT_SOURCE_MISSING",
        sanitizedError: "Fonte de snapshots de readiness não configurada",
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
      { releaseReadiness: input.releaseReadinessSnapshotSource },
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
        errorCode:
          agentResult.context.status === "cancelled"
            ? "MISSION_CANCELLED"
            : "AGENT_EXECUTION_FAILED",
        sanitizedError: agentResult.summary.slice(0, 200),
        assignedAgentId: plan.assignedAgentId,
      };
    }

    const report = agentResult.releaseReadinessReport;
    const summary = report
      ? `${agentResult.summary} · verdict ${report.verdict}`
      : agentResult.summary;

    return {
      success: true,
      summary: summary.slice(0, 240),
      assignedAgentId: plan.assignedAgentId,
    };
  }
}

export type { ReleaseReadinessSnapshotSource };
