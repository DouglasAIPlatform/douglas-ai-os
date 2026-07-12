import {
  computeDurationMs,
  resolveAgentExecutionOutcome,
  type AgentExecutionHistoryEntry,
  type AgentExecutionHistoryScope,
} from "@douglas/agents";
import type { MissionExecutionContext } from "../MissionExecutionTypes";

export function missionContextToHistoryEntry(
  context: MissionExecutionContext,
  scope: AgentExecutionHistoryScope,
): AgentExecutionHistoryEntry {
  const agentId = context.assignedAgentId ?? context.plan?.assignedAgentId ?? "unknown";
  const startedAt = context.startedAt;
  const completedAt = context.completedAt;

  return {
    executionId: context.executionId,
    missionId: context.missionId,
    missionType: context.request.missionType,
    agentId,
    status: context.status,
    outcome: resolveAgentExecutionOutcome(context.status),
    attempt: context.attempt,
    progress: context.progress,
    resultSummary: context.resultSummary,
    sanitizedError: context.sanitizedError,
    correlationId: context.correlationId,
    startedAt,
    completedAt,
    createdAt: startedAt ?? completedAt ?? new Date().toISOString(),
    durationMs: computeDurationMs(startedAt, completedAt),
    dataScope: scope,
  };
}

export function filterHistoryByAgent(
  entries: AgentExecutionHistoryEntry[],
  agentId: string,
): AgentExecutionHistoryEntry[] {
  return entries.filter((entry) => entry.agentId === agentId);
}

export function dedupeHistoryEntries(
  entries: AgentExecutionHistoryEntry[],
): AgentExecutionHistoryEntry[] {
  const seen = new Set<string>();
  const result: AgentExecutionHistoryEntry[] = [];

  for (const entry of entries) {
    if (seen.has(entry.executionId)) continue;
    seen.add(entry.executionId);
    result.push(entry);
  }

  return result;
}

export function sortHistoryNewestFirst(
  entries: AgentExecutionHistoryEntry[],
): AgentExecutionHistoryEntry[] {
  return [...entries].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function abbreviateAgentCorrelationId(correlationId: string): string {
  if (correlationId.length <= 12) return correlationId;
  return `${correlationId.slice(0, 8)}…${correlationId.slice(-4)}`;
}

export function sanitizeHistoryDisplayText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[redacted]")
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[redacted]")
    .slice(0, 240);
}
