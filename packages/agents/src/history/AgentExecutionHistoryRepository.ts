import type {
  AgentExecutionHistoryEntry,
  AgentExecutionHistoryPage,
  AgentExecutionHistoryQuery,
  AgentExecutionHistoryScope,
  AgentExecutionMetricsSnapshot,
  AgentExecutionOutcomeCounts,
} from "./AgentExecutionHistoryTypes";

export interface AgentExecutionHistoryRepository {
  listByAgent(query: AgentExecutionHistoryQuery): Promise<AgentExecutionHistoryPage>;
  listRecent(agentId: string, limit?: number, scope?: AgentExecutionHistoryScope): Promise<AgentExecutionHistoryEntry[]>;
  getAgentMetrics(agentId: string, scope?: AgentExecutionHistoryScope): Promise<AgentExecutionMetricsSnapshot>;
  getLastExecution(agentId: string, scope?: AgentExecutionHistoryScope): Promise<AgentExecutionHistoryEntry | undefined>;
  countByOutcome(agentId: string, scope?: AgentExecutionHistoryScope): Promise<AgentExecutionOutcomeCounts>;
  paginate(query: AgentExecutionHistoryQuery): Promise<AgentExecutionHistoryPage>;
}
