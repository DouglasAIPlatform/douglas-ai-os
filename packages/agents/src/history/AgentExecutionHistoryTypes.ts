/** Origem dos dados de histórico — Sprint 5.51 */
export type AgentExecutionHistoryScope = "session" | "persisted" | "combined";

export type AgentExecutionOutcome =
  | "completed"
  | "failed"
  | "cancelled"
  | "interrupted"
  | "recovery_required"
  | "running"
  | "assigned"
  | "created"
  | "other";

export interface AgentExecutionHistoryEntry {
  executionId: string;
  missionId: string;
  missionType: string;
  agentId: string;
  status: string;
  outcome: AgentExecutionOutcome;
  attempt: number;
  progress: number;
  resultSummary?: string;
  sanitizedError?: string;
  correlationId: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  durationMs?: number;
  dataScope: AgentExecutionHistoryScope;
}

export interface AgentExecutionHistoryQuery {
  agentId: string;
  scope?: AgentExecutionHistoryScope;
  limit?: number;
  offset?: number;
  missionType?: string;
}

export interface AgentExecutionHistoryPage {
  entries: AgentExecutionHistoryEntry[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  scope: AgentExecutionHistoryScope;
  dataSource: "session" | "supabase" | "composite" | "memory";
}

export interface AgentExecutionMetrics {
  agentId: string;
  totalExecutions: number;
  completed: number;
  failed: number;
  cancelled: number;
  interrupted: number;
  successRate: number | null;
  averageDurationMs: number | null;
  lastDurationMs: number | null;
  lastExecutionAt: string | null;
  lastOutcome: AgentExecutionOutcome | null;
  activeExecutions: number;
  missionTypesExecuted: string[];
  sampleSize: number;
  insufficientSample: boolean;
  dataScope: AgentExecutionHistoryScope;
}

export interface AgentExecutionMetricsSnapshot {
  metrics: AgentExecutionMetrics;
  computedAt: string;
  dataSource: AgentExecutionHistoryPage["dataSource"];
}

export interface AgentExecutionOutcomeCounts {
  completed: number;
  failed: number;
  cancelled: number;
  interrupted: number;
  other: number;
  total: number;
}
