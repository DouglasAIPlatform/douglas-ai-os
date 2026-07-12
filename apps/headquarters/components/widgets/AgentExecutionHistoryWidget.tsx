"use client";

import { SYSTEM_DIAGNOSTICS_AGENT_ID } from "@douglas/agents";
import { useEffect, useState } from "react";
import { useAgentExecutionHistoryRepository } from "@/features/agents/AgentExecutionHistoryContext";
import { useOperationalAgent } from "@/features/mission-control/OperationalAgentContext";
import {
  isMissionExecutionPersistenceWithStatus,
  readMissionExecutionPersistenceStatus,
} from "@douglas/missions";
import { useMissionExecutionPersistenceAdapter } from "@/features/mission-control/MissionExecutionPersistenceContext";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type AgentExecutionHistoryWidgetProps = WidgetStateProps;

export function AgentExecutionHistoryWidget({
  isLoading: externalLoading,
  error: externalError,
}: AgentExecutionHistoryWidgetProps) {
  const repository = useAgentExecutionHistoryRepository();
  const { agentRuntime } = useOperationalAgent();
  const persistence = useMissionExecutionPersistenceAdapter();

  const [recentCount, setRecentCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [lastAgentId, setLastAgentId] = useState<string | null>(null);
  const [lastExecutionAt, setLastExecutionAt] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const registeredAgents = agentRuntime.getRegistry().list().length;
  const persistenceAdapter = persistence ?? undefined;
  const persistenceStatus = isMissionExecutionPersistenceWithStatus(persistenceAdapter)
    ? persistenceAdapter.getStatus()
    : readMissionExecutionPersistenceStatus(persistenceAdapter);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setLoadError(null);

        try {
          const recent = await repository.listRecent(SYSTEM_DIAGNOSTICS_AGENT_ID, 5, "combined");
          if (cancelled) return;

          setRecentCount(recent.length);
          setFailureCount(recent.filter((entry) => entry.outcome === "failed").length);

          const last = recent[0];
          if (last) {
            setLastAgentId(last.agentId);
            setLastExecutionAt(last.startedAt ?? last.createdAt);
          } else {
            setLastAgentId(null);
            setLastExecutionAt(null);
          }
        } catch (cause) {
          if (cancelled) return;
          setLoadError(cause instanceof Error ? cause.message : "Falha ao carregar resumo");
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [repository]);

  const displayError = externalError ?? loadError;
  const loading = externalLoading ?? isLoading;
  const persistenceActive =
    persistenceStatus.activeAdapter === "supabase" && !persistenceStatus.fallbackActive;

  return (
    <WidgetFrame
      title="Histórico de Agentes"
      description="Resumo operacional — detalhes em /agents"
      isLoading={loading}
      error={displayError}
      footer={
        lastAgentId
          ? `Último agente: ${lastAgentId}${lastExecutionAt ? ` · ${formatTime(lastExecutionAt)}` : ""}`
          : "Nenhuma execução recente"
      }
    >
      <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Agentes registrados" value={String(registeredAgents)} />
        <Metric label="Execuções recentes" value={String(recentCount)} />
        <Metric label="Falhas recentes" value={String(failureCount)} />
        <Metric
          label="Persistência"
          value={
            persistenceActive
              ? "Supabase ativa"
              : persistenceStatus.fallbackActive
                ? "Fallback sessão"
                : "Sessão"
          }
        />
      </div>
    </WidgetFrame>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] p-[var(--ds-space-2)]">
      <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">{label}</p>
      <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
        {value}
      </p>
    </div>
  );
}
