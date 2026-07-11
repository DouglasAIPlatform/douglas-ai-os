"use client";

import {
  SYSTEM_DIAGNOSTICS_AGENT_ID,
  SYSTEM_DIAGNOSTICS_AGENT_MANIFEST,
} from "@douglas/agents";
import { Card, DashboardLayout, PageHeader } from "@douglas/ui";
import { useOperationalAgent } from "@/features/mission-control/OperationalAgentContext";
import { getRouteBreadcrumbs, getRouteById } from "@/config/routes";

function successRate(metrics: {
  executions: number;
  completed: number;
}): string {
  if (metrics.executions === 0) return "—";
  return `${Math.round((metrics.completed / metrics.executions) * 100)}%`;
}

export function AgentsPageContent() {
  const route = getRouteById("agents");
  const breadcrumbs = getRouteBreadcrumbs("agents");
  const {
    getDiagnosticsAgentMetrics,
    getDiagnosticsAgentManifest,
    getDiagnosticsAgentStatus,
    getLastDiagnosticsReport,
  } = useOperationalAgent();

  const manifest = getDiagnosticsAgentManifest() ?? SYSTEM_DIAGNOSTICS_AGENT_MANIFEST;
  const metrics = getDiagnosticsAgentMetrics();
  const status = getDiagnosticsAgentStatus();
  const report = getLastDiagnosticsReport();

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
      <div className="grid gap-[var(--ds-space-4)] lg:grid-cols-2">
        <Card className="lg:col-span-2">
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

            <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Status runtime" value={status} />
              <Stat label="Execuções (sessão)" value={String(metrics.executions)} />
              <Stat label="Taxa de sucesso" value={successRate(metrics)} />
              <Stat
                label="Última execução"
                value={
                  metrics.lastExecutionAt
                    ? new Date(metrics.lastExecutionAt).toLocaleTimeString("pt-BR")
                    : "—"
                }
              />
            </div>

            <div>
              <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)]">
                Capabilities
              </p>
              <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                {manifest.capabilities.join(" · ")}
              </p>
            </div>

            {report ? (
              <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] p-[var(--ds-space-3)]">
                <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)]">
                  Último relatório · {report.overallStatus}
                </p>
                <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  Riscos: {report.identifiedRisks.length} · Recomendações:{" "}
                  {report.recommendations.length}
                </p>
              </div>
            ) : (
              <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Sem execução registrada nesta sessão — execute o diagnóstico no Headquarters.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-[var(--ds-space-4)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Outros agentes do catálogo permanecem demonstrativos nesta fase. Somente{" "}
            <code>{SYSTEM_DIAGNOSTICS_AGENT_ID}</code> possui runtime operacional read-only
            integrado ao MissionExecutionCoordinator.
          </div>
        </Card>
      </div>
    </DashboardLayout>
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
