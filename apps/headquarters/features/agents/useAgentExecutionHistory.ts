"use client";

import type {
  AgentExecutionHistoryEntry,
  AgentExecutionHistoryScope,
  AgentExecutionMetricsSnapshot,
} from "@douglas/agents";
import { DEFAULT_AGENT_EXECUTION_RETENTION_POLICY } from "@douglas/agents";
import { buildAgentHistoryEventPayload } from "@douglas/events";
import { useEventBus } from "@douglas/events";
import {
  isMissionExecutionPersistenceWithStatus,
  readMissionExecutionPersistenceStatus,
} from "@douglas/missions";
import { useCallback, useEffect, useState } from "react";
import { useAgentExecutionHistoryRepository } from "./AgentExecutionHistoryContext";
import { useMissionExecutionPersistenceAdapter } from "@/features/mission-control/MissionExecutionPersistenceContext";

export function useAgentExecutionHistory(agentId: string) {
  const repository = useAgentExecutionHistoryRepository();
  const persistence = useMissionExecutionPersistenceAdapter();
  const { publish } = useEventBus();

  const [scope, setScopeState] = useState<AgentExecutionHistoryScope>("combined");
  const [history, setHistory] = useState<AgentExecutionHistoryEntry[]>([]);
  const [metrics, setMetrics] = useState<AgentExecutionMetricsSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  const pageSize = DEFAULT_AGENT_EXECUTION_RETENTION_POLICY.defaultPageSize;
  const persistenceAdapter = persistence ?? undefined;
  const persistenceStatus = isMissionExecutionPersistenceWithStatus(persistenceAdapter)
    ? persistenceAdapter.getStatus()
    : readMissionExecutionPersistenceStatus(persistenceAdapter);

  const setScope = useCallback((nextScope: AgentExecutionHistoryScope) => {
    setScopeState(nextScope);
    setOffset(0);
  }, []);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setError(null);

        try {
          const page = await repository.paginate({
            agentId,
            scope,
            limit: pageSize,
            offset,
          });

          if (cancelled) return;

          setHistory(page.entries);
          setHasMore(page.hasMore);
          setTotal(page.total);

          const nextMetrics = await repository.getAgentMetrics(agentId, scope);
          if (cancelled) return;

          setMetrics(nextMetrics);

          publish(
            "agent:metrics_updated",
            "agents",
            buildAgentHistoryEventPayload({
              agentId,
              entryCount: page.entries.length,
              dataSource: page.dataSource,
              summary: `Métricas atualizadas (${page.total} execuções)`,
              audited: true,
            }),
          );
        } catch (cause) {
          if (cancelled) return;

          const message = cause instanceof Error ? cause.message : "Falha ao carregar histórico";
          setError(message);
          publish(
            "agent:history_load_failed",
            "agents",
            buildAgentHistoryEventPayload({
              agentId,
              errorCode: "history_load_failed",
              summary: message,
              audited: true,
            }),
          );
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [agentId, offset, pageSize, publish, reloadToken, repository, scope]);

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setOffset((current) => current + pageSize);
  }, [hasMore, pageSize]);

  const dataSourceLabel =
    metrics?.dataSource === "supabase"
      ? "Supabase"
      : metrics?.dataSource === "composite"
        ? "Sessão + Supabase"
        : "Sessão";

  return {
    history,
    metrics,
    scope,
    setScope,
    isLoading,
    error,
    hasMore,
    total,
    offset,
    loadMore,
    refresh,
    persistenceStatus,
    dataSourceLabel,
  };
}
