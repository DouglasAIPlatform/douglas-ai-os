/** Capabilities operacionais read-only — Sprint 5.49 */
export type OperationalAgentCapability =
  | "platform:diagnostics"
  | "runtime:inspect"
  | "health:inspect"
  | "dependencies:inspect"
  | "events:inspect"
  | "audit:summary"
  | (string & {});

export type AgentRuntimeStatus =
  | "idle"
  | "assigned"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "unavailable";

export interface OperationalAgentManifest {
  id: string;
  name: string;
  department: string;
  version: string;
  description: string;
  capabilities: OperationalAgentCapability[];
  readOnly: boolean;
  supportedMissionTypes: string[];
}

export interface OperationalAgent extends OperationalAgentManifest {
  status: AgentRuntimeStatus;
}

export interface AgentExecutionRequest {
  agentId: string;
  executionId: string;
  correlationId: string;
  requestId: string;
  missionId: string;
  missionType: string;
  createdBy: string;
}

export interface AgentExecutionContext {
  request: AgentExecutionRequest;
  status: AgentRuntimeStatus;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  progress: number;
  currentStep?: string;
  durationMs?: number;
}

export interface AgentExecutionReport {
  overallStatus: "healthy" | "degraded" | "critical" | "unknown";
  healthyModules: string[];
  alertModules: string[];
  criticalModules: string[];
  dependencyIssues: string[];
  recentOperationalEvents: string[];
  auditState: string;
  currentEnvironment: string;
  readiness: string;
  identifiedRisks: string[];
  recommendations: string[];
  timestamp: string;
  executionId: string;
  correlationId: string;
}

export interface AgentExecutionResult {
  context: AgentExecutionContext;
  success: boolean;
  summary: string;
  report?: AgentExecutionReport;
}

export interface AgentExecutionError {
  context: AgentExecutionContext;
  errorCode: string;
  message: string;
  sanitizedMessage: string;
}

export interface AgentSessionMetrics {
  executions: number;
  completed: number;
  failed: number;
  cancelled: number;
  averageDurationMs: number;
  lastExecutionAt?: string;
  lastOutcome?: "completed" | "failed" | "cancelled";
}

export const SYSTEM_DIAGNOSTICS_AGENT_ID = "system-diagnostics-agent";

export const SYSTEM_DIAGNOSTICS_AGENT_MANIFEST: OperationalAgentManifest = {
  id: SYSTEM_DIAGNOSTICS_AGENT_ID,
  name: "System Diagnostics Agent",
  department: "Operations",
  version: "1.0.0",
  description:
    "Agente operacional read-only para diagnóstico da plataforma usando snapshots internos.",
  capabilities: [
    "platform:diagnostics",
    "runtime:inspect",
    "health:inspect",
    "dependencies:inspect",
    "events:inspect",
    "audit:summary",
  ],
  readOnly: true,
  supportedMissionTypes: ["operational_diagnostic"],
};

export const OPERATIONAL_DIAGNOSTIC_REQUIRED_CAPABILITIES: OperationalAgentCapability[] = [
  "platform:diagnostics",
];
