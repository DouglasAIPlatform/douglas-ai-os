/** Payload mínimo e sanitizado para eventos agent:* — Sprint 5.49 */
export interface AgentOperationalEventPayload {
  agentId?: string;
  executionId?: string;
  correlationId?: string;
  missionId?: string;
  missionType?: string;
  status?: string;
  progress?: number;
  currentStep?: string;
  summary?: string;
  errorCode?: string;
  decision?: string;
  reason?: string;
  overallStatus?: string;
  name?: string;
  version?: string;
  readOnly?: boolean;
  audited?: boolean;
}

export const AGENT_OPERATIONAL_EVENT_TOPICS = [
  "agent:registered",
  "agent:assigned",
  "agent:execution_started",
  "agent:progress",
  "agent:execution_completed",
  "agent:execution_failed",
  "agent:execution_cancelled",
  "agent:assignment_rejected",
] as const;

export type AgentOperationalEventTopic = (typeof AGENT_OPERATIONAL_EVENT_TOPICS)[number];

export function buildAgentOperationalPayload(
  input: AgentOperationalEventPayload,
): AgentOperationalEventPayload {
  return {
    ...input,
    ...(input.summary ? { summary: input.summary.slice(0, 240) } : {}),
  };
}
