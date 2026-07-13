import type {
  AgentExecutionHistoryEntry,
  AgentExecutionHistoryScope,
  AgentExecutionMetrics,
  AgentExecutionMetricsSnapshot,
} from "@douglas/agents";
import { buildAgentExecutionMetricsSnapshot } from "@douglas/agents";
import {
  dedupeHistoryEntries,
  filterHistoryByAgent,
} from "../../history/AgentExecutionHistoryMapper";

export interface StagingPersistenceMetricsValidation {
  valid: boolean;
  reasons: string[];
  metrics: AgentExecutionMetrics;
  dataScope: AgentExecutionHistoryScope;
  persistedProof: boolean;
  dataSource: AgentExecutionMetricsSnapshot["dataSource"];
}

const MEMORY_ONLY_SOURCES = new Set<AgentExecutionMetricsSnapshot["dataSource"]>([
  "memory",
  "session",
]);

export function validateRehydratedAgentMetrics(input: {
  agentId: string;
  entries: AgentExecutionHistoryEntry[];
  scope: AgentExecutionHistoryScope;
  dataSource: AgentExecutionMetricsSnapshot["dataSource"];
  requirePersistedProof?: boolean;
}): StagingPersistenceMetricsValidation {
  const deduped = dedupeHistoryEntries(filterHistoryByAgent(input.entries, input.agentId));
  const snapshot = buildAgentExecutionMetricsSnapshot({
    agentId: input.agentId,
    entries: deduped,
    scope: input.scope,
    dataSource: input.dataSource,
  });
  const metrics = snapshot.metrics;
  const reasons: string[] = [];
  const requirePersisted = input.requirePersistedProof ?? true;

  if (requirePersisted && MEMORY_ONLY_SOURCES.has(input.dataSource)) {
    reasons.push("Métricas somente em memória/session — não prova persistência remota.");
  }

  if (metrics.totalExecutions < 0) {
    reasons.push("totalExecutions inválido.");
  }

  const terminalSum =
    metrics.completed + metrics.failed + metrics.cancelled + metrics.interrupted;
  if (terminalSum > metrics.totalExecutions) {
    reasons.push("Contagens terminais excedem totalExecutions.");
  }

  if (
    metrics.lastExecutionAt &&
    metrics.totalExecutions === 0
  ) {
    reasons.push("lastExecutionAt sem execuções registradas.");
  }

  if (
    metrics.successRate !== null &&
    (metrics.successRate < 0 || metrics.successRate > 1)
  ) {
    reasons.push("successRate fora do intervalo 0–1.");
  }

  if (
    metrics.averageDurationMs !== null &&
    metrics.averageDurationMs < 0
  ) {
    reasons.push("averageDurationMs negativo.");
  }

  const persistedProof =
    !MEMORY_ONLY_SOURCES.has(input.dataSource) &&
    (input.dataSource === "supabase" || input.dataSource === "composite");

  return {
    valid: reasons.length === 0 && (!requirePersisted || persistedProof),
    reasons,
    metrics,
    dataScope: input.scope,
    persistedProof,
    dataSource: input.dataSource,
  };
}

export function validateMultiAgentMetricsIsolation(input: {
  diagnosticsAgentId: string;
  releaseAgentId: string;
  entries: AgentExecutionHistoryEntry[];
  diagnosticsMetrics: AgentExecutionMetrics;
  releaseMetrics: AgentExecutionMetrics;
}): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const combined = dedupeHistoryEntries(input.entries);

  const diagnosticsEntries = filterHistoryByAgent(combined, input.diagnosticsAgentId);
  const releaseEntries = filterHistoryByAgent(combined, input.releaseAgentId);

  const diagnosticsIds = new Set(diagnosticsEntries.map((e) => e.executionId));
  const releaseIds = new Set(releaseEntries.map((e) => e.executionId));

  for (const id of diagnosticsIds) {
    if (releaseIds.has(id)) {
      reasons.push(`executionId ${id} aparece em ambos agentes.`);
    }
  }

  if (
    input.diagnosticsMetrics.agentId !== input.diagnosticsAgentId ||
    input.releaseMetrics.agentId !== input.releaseAgentId
  ) {
    reasons.push("Métricas atribuídas ao agentId incorreto.");
  }

  if (
    input.diagnosticsMetrics.totalExecutions !== diagnosticsEntries.length ||
    input.releaseMetrics.totalExecutions !== releaseEntries.length
  ) {
    reasons.push("totalExecutions não alinha com histórico filtrado por agentId.");
  }

  const crossMissionLeak = diagnosticsEntries.some((entry) =>
    releaseEntries.some(
      (other) =>
        other.executionId === entry.executionId &&
        other.agentId !== entry.agentId,
    ),
  );
  if (crossMissionLeak) {
    reasons.push("Vazamento de execução entre agentes detectado.");
  }

  return { valid: reasons.length === 0, reasons };
}

export function assertCompletedExecutionDoesNotRestartAgent(input: {
  executionStatus: string;
  agentExecuteCountBefore: number;
  agentExecuteCountAfter: number;
}): { valid: boolean; reason: string } {
  if (input.executionStatus !== "completed") {
    return { valid: true, reason: "Estado não terminal completed — skip." };
  }
  if (input.agentExecuteCountAfter > input.agentExecuteCountBefore) {
    return {
      valid: false,
      reason: "Agente foi executado novamente após conclusão persistida.",
    };
  }
  return { valid: true, reason: "Agente não reexecutado após completed." };
}
