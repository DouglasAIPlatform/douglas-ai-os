"use client";

import {
  RELEASE_READINESS_AGENT_ID,
  RELEASE_READINESS_AGENT_MANIFEST,
  SYSTEM_DIAGNOSTICS_AGENT_ID,
  SYSTEM_DIAGNOSTICS_AGENT_MANIFEST,
  type OperationalAgentManifest,
} from "@douglas/agents";
import { abbreviateAgentCorrelationId, sanitizeHistoryDisplayText } from "@douglas/missions";
import { Card, DashboardLayout, PageHeader } from "@douglas/ui";
import { useOperationalAgent } from "@/features/mission-control/OperationalAgentContext";
import { getRouteBreadcrumbs, getRouteById } from "@/config/routes";
import { useAgentExecutionHistory } from "./useAgentExecutionHistory";

const OUTCOME_LABELS: Record<string, string> = {
  completed: "Concluída",
  failed: "Falha",
  cancelled: "Cancelada",
  interrupted: "Interrompida",
  recovery_required: "Recuperação",
  running: "Em execução",
  assigned: "Atribuída",
  created: "Criada",
  other: "Outro",
};

function formatSuccessRate(rate: number | null | undefined, insufficient: boolean): string {
  if (insufficient || rate === null || rate === undefined) return "—";
  return `${Math.round(rate * 100)}%`;
}

function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

export function AgentsPageContent() {
  const route = getRouteById("agents");
  const breadcrumbs = getRouteBreadcrumbs("agents");
  const {
    listRegisteredAgents,
    getDiagnosticsAgentManifest,
    getDiagnosticsAgentStatus,
    getReleaseReadinessAgentManifest,
    getReleaseReadinessAgentStatus,
    getLastReleaseReadinessReport,
    getLastDiagnosticsReport,
  } = useOperationalAgent();

  const agents = listRegisteredAgents();

  return (
    <DashboardLayout
      header={
        <PageHeader
          eyebrow="Douglas AI OS"
          title={route.title}
          subtitle={route.subtitle}
          breadcrumbs={breadcrumbs}
        />
      }
    >
      <div className="grid gap-[var(--ds-space-4)]">
        {agents.map((manifest) => (
          <AgentSection
            key={manifest.id}
            manifest={
              manifest.id === SYSTEM_DIAGNOSTICS_AGENT_ID
                ? getDiagnosticsAgentManifest() ?? SYSTEM_DIAGNOSTICS_AGENT_MANIFEST
                : manifest.id === RELEASE_READINESS_AGENT_ID
                  ? getReleaseReadinessAgentManifest() ?? RELEASE_READINESS_AGENT_MANIFEST
                  : manifest
            }
            status={
              manifest.id === SYSTEM_DIAGNOSTICS_AGENT_ID
                ? getDiagnosticsAgentStatus()
                : manifest.id === RELEASE_READINESS_AGENT_ID
                  ? getReleaseReadinessAgentStatus()
                  : "unknown"
            }
            lastReportNote={
              manifest.id === SYSTEM_DIAGNOSTICS_AGENT_ID
                ? (() => {
                    const report = getLastDiagnosticsReport();
                    return report
                      ? `Último relatório · ${report.overallStatus} · riscos ${report.identifiedRisks.length}`
                      : null;
                  })()
                : manifest.id === RELEASE_READINESS_AGENT_ID
                  ? (() => {
                      const report = getLastReleaseReadinessReport();
                      return report
                        ? `Último verdict · ${report.verdict} · ${report.blockers.length} bloqueio(s)`
                        : null;
                    })()
                  : null
            }
          />
        ))}
      </div>
    </DashboardLayout>
  );
}

function AgentSection({
  manifest,
  status,
  lastReportNote,
}: {
  manifest: OperationalAgentManifest;
  status: string;
  lastReportNote: string | null;
}) {
  const {
    history,
    metrics,
    scope,
    setScope,
    isLoading,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
    dataSourceLabel,
  } = useAgentExecutionHistory(manifest.id);

  const agentMetrics = metrics?.metrics;

  return (
    <Card>
      <div className="space-y-[var(--ds-space-3)] p-[var(--ds-space-4)]">
        <div className="flex flex-wrap items-center justify-between gap-[var(--ds-space-2)]">
          <div>
            <h2 className="text-[length:var(--ds-font-size-lg)] font-[var(--ds-font-weight-medium)]">
              {manifest.name}
            </h2>
            <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              {manifest.id} · v{manifest.version} · {manifest.department}
            </p>
          </div>
          <span className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)]">
            Read-only operacional
          </span>
        </div>

        <p className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
          {manifest.description}
        </p>

        <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
          Missões: {manifest.supportedMissionTypes.join(", ")}
        </p>

        <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
          <ScopeSelector scope={scope} onChange={setScope} />
          <span className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Origem: {dataSourceLabel}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isLoading}
            className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] disabled:opacity-50"
          >
            Atualizar
          </button>
        </div>

        <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Status runtime" value={status} />
          <Stat label="Total execuções" value={agentMetrics ? String(agentMetrics.totalExecutions) : "—"} />
          <Stat label="Concluídas" value={agentMetrics ? String(agentMetrics.completed) : "—"} />
          <Stat label="Falhas" value={agentMetrics ? String(agentMetrics.failed) : "—"} />
          <Stat
            label="Taxa de sucesso"
            value={formatSuccessRate(agentMetrics?.successRate, agentMetrics?.insufficientSample ?? true)}
          />
          <Stat label="Duração média" value={formatDuration(agentMetrics?.averageDurationMs)} />
          <Stat label="Última execução" value={formatDateTime(agentMetrics?.lastExecutionAt)} />
        </div>

        <div>
          <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)]">Capabilities</p>
          <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            {manifest.capabilities.join(" · ")}
          </p>
        </div>

        {lastReportNote ? (
          <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">{lastReportNote}</p>
        ) : null}

        <div className="border-t border-[var(--ds-color-border-subtle)] pt-[var(--ds-space-3)]">
          <div className="mb-[var(--ds-space-2)] flex items-center justify-between">
            <h3 className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)]">
              Histórico de execuções
            </h3>
            <span className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              {total} registro(s)
            </span>
          </div>

          {error ? (
            <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-status-warning)]">{error}</p>
          ) : null}

          {isLoading && history.length === 0 ? (
            <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">Carregando…</p>
          ) : history.length === 0 ? (
            <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Nenhuma execução registrada neste escopo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[length:var(--ds-font-size-xs)]">
                <thead>
                  <tr className="border-b border-[var(--ds-color-border-subtle)] text-[var(--ds-color-text-muted)]">
                    <th className="py-[var(--ds-space-2)] pr-[var(--ds-space-2)]">Data</th>
                    <th className="py-[var(--ds-space-2)] pr-[var(--ds-space-2)]">Missão</th>
                    <th className="py-[var(--ds-space-2)] pr-[var(--ds-space-2)]">Outcome</th>
                    <th className="py-[var(--ds-space-2)] pr-[var(--ds-space-2)]">Duração</th>
                    <th className="py-[var(--ds-space-2)] pr-[var(--ds-space-2)]">Resumo</th>
                    <th className="py-[var(--ds-space-2)]">Corr.</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.executionId} className="border-b border-[var(--ds-color-border-subtle)]">
                      <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-2)] tabular-nums">
                        {formatDateTime(entry.startedAt ?? entry.createdAt)}
                      </td>
                      <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-2)]">{entry.missionType}</td>
                      <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-2)]">
                        {OUTCOME_LABELS[entry.outcome] ?? entry.outcome}
                      </td>
                      <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-2)] tabular-nums">
                        {formatDuration(entry.durationMs)}
                      </td>
                      <td className="max-w-[200px] truncate py-[var(--ds-space-2)] pr-[var(--ds-space-2)] text-[var(--ds-color-text-muted)]">
                        {sanitizeHistoryDisplayText(entry.resultSummary ?? entry.sanitizedError) ?? "—"}
                      </td>
                      <td className="py-[var(--ds-space-2)] font-mono text-[var(--ds-color-text-muted)]">
                        {abbreviateAgentCorrelationId(entry.correlationId)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {hasMore ? (
            <button
              type="button"
              onClick={loadMore}
              disabled={isLoading}
              className="mt-[var(--ds-space-2)] rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] disabled:opacity-50"
            >
              Carregar mais
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function ScopeSelector({
  scope,
  onChange,
}: {
  scope: "combined" | "session" | "persisted";
  onChange: (scope: "combined" | "session" | "persisted") => void;
}) {
  const options = [
    { value: "combined" as const, label: "Combinado" },
    { value: "session" as const, label: "Sessão" },
    { value: "persisted" as const, label: "Persistido" },
  ];

  return (
    <div className="flex flex-wrap gap-[var(--ds-space-1)]">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-[var(--ds-radius-sm)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] ${
            scope === option.value
              ? "bg-[var(--ds-color-brand-accent)] text-[var(--ds-color-text-inverse)]"
              : "border border-[var(--ds-color-border-subtle)] text-[var(--ds-color-text-muted)]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] p-[var(--ds-space-2)]">
      <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">{label}</p>
      <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)]">
        {value}
      </p>
    </div>
  );
}
