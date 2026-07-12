import type {
  AgentExecutionHistoryEntry,
  AgentExecutionMetrics,
  AgentExecutionMetricsSnapshot,
  AgentExecutionOutcome,
  AgentExecutionOutcomeCounts,
  AgentExecutionHistoryScope,
} from "./AgentExecutionHistoryTypes";

const TERMINAL_OUTCOMES: AgentExecutionOutcome[] = [
  "completed",
  "failed",
  "cancelled",
  "interrupted",
  "recovery_required",
];

const ACTIVE_OUTCOMES: AgentExecutionOutcome[] = ["running", "assigned"];

export function resolveAgentExecutionOutcome(status: string): AgentExecutionOutcome {
  switch (status) {
    case "completed":
    case "failed":
    case "cancelled":
    case "interrupted":
    case "recovery_required":
    case "running":
    case "assigned":
    case "created":
      return status;
    default:
      return "other";
  }
}

export function computeDurationMs(
  startedAt?: string,
  completedAt?: string,
): number | undefined {
  if (!startedAt || !completedAt) return undefined;
  const start = Date.parse(startedAt);
  const end = Date.parse(completedAt);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return undefined;
  return end - start;
}

export function countByOutcome(
  entries: AgentExecutionHistoryEntry[],
): AgentExecutionOutcomeCounts {
  const counts: AgentExecutionOutcomeCounts = {
    completed: 0,
    failed: 0,
    cancelled: 0,
    interrupted: 0,
    other: 0,
    total: entries.length,
  };

  for (const entry of entries) {
    switch (entry.outcome) {
      case "completed":
        counts.completed += 1;
        break;
      case "failed":
        counts.failed += 1;
        break;
      case "cancelled":
        counts.cancelled += 1;
        break;
      case "interrupted":
      case "recovery_required":
        counts.interrupted += 1;
        break;
      default:
        counts.other += 1;
    }
  }

  return counts;
}

export function calculateAgentExecutionMetrics(input: {
  agentId: string;
  entries: AgentExecutionHistoryEntry[];
  scope: AgentExecutionHistoryScope;
}): AgentExecutionMetrics {
  const { agentId, entries, scope } = input;
  const counts = countByOutcome(entries);
  const terminalEntries = entries.filter((e) => TERMINAL_OUTCOMES.includes(e.outcome));
  const completedEntries = entries.filter((e) => e.outcome === "completed");
  const activeExecutions = entries.filter((e) => ACTIVE_OUTCOMES.includes(e.outcome)).length;

  const durations = terminalEntries
    .map((e) => e.durationMs)
    .filter((d): d is number => typeof d === "number" && d >= 0);

  const averageDurationMs =
    durations.length > 0
      ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      : null;

  const sorted = [...entries].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  const last = sorted[0];

  const successRate =
    terminalEntries.length > 0
      ? Math.round((counts.completed / terminalEntries.length) * 100) / 100
      : null;

  const missionTypesExecuted = [
    ...new Set(entries.map((e) => e.missionType).filter(Boolean)),
  ].sort();

  return {
    agentId,
    totalExecutions: entries.length,
    completed: counts.completed,
    failed: counts.failed,
    cancelled: counts.cancelled,
    interrupted: counts.interrupted,
    successRate,
    averageDurationMs,
    lastDurationMs: last?.durationMs ?? null,
    lastExecutionAt: last?.createdAt ?? null,
    lastOutcome: last?.outcome ?? null,
    activeExecutions,
    missionTypesExecuted,
    sampleSize: entries.length,
    insufficientSample: entries.length === 0,
    dataScope: scope,
  };
}

export function buildAgentExecutionMetricsSnapshot(input: {
  agentId: string;
  entries: AgentExecutionHistoryEntry[];
  scope: AgentExecutionHistoryScope;
  dataSource: AgentExecutionMetricsSnapshot["dataSource"];
}): AgentExecutionMetricsSnapshot {
  return {
    metrics: calculateAgentExecutionMetrics({
      agentId: input.agentId,
      entries: input.entries,
      scope: input.scope,
    }),
    computedAt: new Date().toISOString(),
    dataSource: input.dataSource,
  };
}
