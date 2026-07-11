/** Status do lifecycle de execução — Sprint 5.48 */
export type MissionExecutionStatus =
  | "created"
  | "validated"
  | "planned"
  | "assigned"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type MissionOperatorRole = "owner" | "admin" | "operator" | "viewer";

export interface MissionExecutionRequest {
  missionId?: string;
  executionId: string;
  correlationId: string;
  requestId: string;
  createdBy: string;
  createdByRole: string;
  missionType: string;
  title: string;
  description?: string;
  idempotencyKey?: string;
  isRetry?: boolean;
  previousExecutionId?: string;
}

export interface MissionExecutionStep {
  id: string;
  label: string;
  order: number;
}

export interface MissionExecutionPlan {
  executionId: string;
  missionId: string;
  steps: MissionExecutionStep[];
  assignedAgentId: string;
  estimatedDurationMs: number;
}

export interface MissionExecutionContext {
  request: MissionExecutionRequest;
  plan?: MissionExecutionPlan;
  status: MissionExecutionStatus;
  missionId: string;
  executionId: string;
  correlationId: string;
  requestId: string;
  createdBy: string;
  assignedAgentId?: string;
  currentStep?: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  resultSummary?: string;
  sanitizedError?: string;
  attempt: number;
}

export interface MissionExecutionResult {
  context: MissionExecutionContext;
  success: boolean;
  summary: string;
}

export interface MissionExecutionFailure {
  context: MissionExecutionContext;
  errorCode: string;
  message: string;
  sanitizedMessage: string;
}

export const MISSION_EXECUTION_STATUS_LABELS: Record<MissionExecutionStatus, string> = {
  created: "Criada",
  validated: "Validada",
  planned: "Planejada",
  assigned: "Atribuída",
  running: "Em execução",
  completed: "Concluída",
  failed: "Falhou",
  cancelled: "Cancelada",
};

/** Missão demonstrativa determinística — sem IA externa. */
export const OPERATIONAL_DIAGNOSTIC_MISSION_TYPE = "operational_diagnostic";
export const OPERATIONAL_DIAGNOSTIC_MISSION_TITLE =
  "Executar diagnóstico operacional da Douglas AI OS";
export const OPERATIONAL_DIAGNOSTIC_AGENT_ID = "system-diagnostics-agent";
/** @deprecated Use SYSTEM_DIAGNOSTICS_AGENT_ID from @douglas/agents */
export const LEGACY_PLATFORM_DIAGNOSTICS_AGENT_ID = "agent:platform-diagnostics";

export function abbreviateCorrelationId(correlationId: string): string {
  if (correlationId.length <= 12) {
    return correlationId;
  }
  return `${correlationId.slice(0, 8)}…${correlationId.slice(-4)}`;
}
