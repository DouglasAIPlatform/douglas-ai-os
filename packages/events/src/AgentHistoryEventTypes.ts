/** Eventos de histórico/métricas de agente — Sprint 5.51 */
export interface AgentHistoryEventPayload {
  agentId: string;
  summary?: string;
  errorCode?: string;
  entryCount?: number;
  dataSource?: string;
  /** Evita loop de audit. */
  audited?: boolean;
}

export const AGENT_HISTORY_EVENT_TOPICS = [
  "agent:history_rehydrated",
  "agent:metrics_updated",
  "agent:history_load_failed",
] as const;

export type AgentHistoryEventTopic = (typeof AGENT_HISTORY_EVENT_TOPICS)[number];

export function buildAgentHistoryEventPayload(input: {
  agentId: string;
  summary?: string;
  errorCode?: string;
  entryCount?: number;
  dataSource?: string;
  audited?: boolean;
}): AgentHistoryEventPayload {
  return {
    agentId: input.agentId,
    ...(input.summary ? { summary: input.summary.slice(0, 240) } : {}),
    ...(input.errorCode ? { errorCode: input.errorCode } : {}),
    ...(typeof input.entryCount === "number" ? { entryCount: input.entryCount } : {}),
    ...(input.dataSource ? { dataSource: input.dataSource } : {}),
    ...(input.audited ? { audited: true } : {}),
  };
}
