"use client";

import {
  DEMO_DATA_UNCONNECTED_DESCRIPTION,
  DEMO_DATA_UNCONNECTED_TITLE,
  useDemoData,
} from "@douglas/demo-data";
import { usePlatformBootstrap } from "@douglas/bootstrap";
import {
  createDependencyGraph,
  DEPENDENCY_EDGE_STATUS_LABELS,
  DEPENDENCY_GRAPH_STATUS_LABELS,
  DEPENDENCY_ISSUE_TYPE_LABELS,
  DEPENDENCY_TYPE_LABELS,
  type DependencyReport,
} from "@douglas/graph";
import { usePlatformRuntime } from "@douglas/runtime";
import { useMemo } from "react";
import {
  buildLiveDependencyGraphInput,
  platformDependencyGraphInput,
} from "@/features/platform-graph";
import type { PlatformHealthSources } from "@/features/platform-health/checks";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type DependencyGraphWidgetProps = WidgetStateProps;

export function DependencyGraphWidget({
  isLoading: externalLoading,
  error: externalError,
}: DependencyGraphWidgetProps) {
  const { isSourceEnabled } = useDemoData();
  const graphMocksEnabled = isSourceEnabled("graph_mocks");
  const bootstrap = usePlatformBootstrap();
  const runtime = usePlatformRuntime();

  const healthSources: PlatformHealthSources = useMemo(
    () => ({
      bootstrapReady: bootstrap.isReady,
      runtimeRunning: runtime.isRunning,
      platformUptimeMs: runtime.state.uptimeMs,
      findBootstrapModule: (id) =>
        bootstrap.state.modules.find((module) => module.id === id),
      findRuntimeModule: (id) =>
        runtime.state.modules.find((module) => module.id === id),
    }),
    [
      bootstrap.isReady,
      bootstrap.state.modules,
      runtime.isRunning,
      runtime.state.modules,
      runtime.state.uptimeMs,
    ],
  );

  const { report, dataSource } = useMemo(() => {
    const useLiveData = bootstrap.isReady || runtime.isRunning;

    if (useLiveData) {
      const input = buildLiveDependencyGraphInput(healthSources);
      return {
        report: createDependencyGraph(input).getReport(),
        dataSource: "live" as const,
      };
    }

    if (!graphMocksEnabled) {
      return {
        report: null,
        dataSource: "none" as const,
      };
    }

    return {
      report: createDependencyGraph(platformDependencyGraphInput).getReport(),
      dataSource: "static-fallback" as const,
    };
  }, [bootstrap.isReady, graphMocksEnabled, healthSources, runtime.isRunning]);

  const isLoading = externalLoading ?? false;
  const error = externalError ?? null;

  return (
    <WidgetFrame
      title="Dependency Graph"
      description="Mapa de dependências entre módulos da plataforma"
      isLoading={isLoading}
      error={error}
      isEmpty={!report}
      emptyTitle={
        dataSource === "none"
          ? DEMO_DATA_UNCONNECTED_TITLE
          : "Grafo não disponível"
      }
      emptyDescription={
        dataSource === "none"
          ? DEMO_DATA_UNCONNECTED_DESCRIPTION
          : "Nenhuma dependência registrada."
      }
      footer={
        report
          ? `${report.edgeCount} dependências · ${DEPENDENCY_GRAPH_STATUS_LABELS[report.status]} · ${
              dataSource === "live"
                ? "Dados live (bootstrap + runtime)"
                : "Fallback: topologia estática (seeds)"
            }`
          : dataSource === "none"
            ? "Demo desligado — conecte bootstrap/runtime ou ative graph_mocks"
            : undefined
      }
    >
      {report ? <DependencyGraphContent report={report} /> : null}
    </WidgetFrame>
  );
}

function DependencyGraphContent({ report }: { report: DependencyReport }) {
  return (
    <div className="space-y-[var(--ds-space-4)]">
      <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Módulos" value={String(report.moduleCount)} />
        <Stat label="Dependências" value={String(report.edgeCount)} />
        <Stat label="Saudáveis" value={String(report.healthyEdgeCount)} />
        <Stat
          label="Alertas"
          value={String(report.warningEdgeCount + report.issues.filter((i) => i.severity === "warning").length)}
          highlight={report.warningEdgeCount > 0}
        />
        <Stat
          label="Problemas"
          value={String(report.issues.length)}
          highlight={report.issues.length > 0}
        />
      </div>

      <div>
        <h3 className="mb-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] uppercase tracking-wide text-[var(--ds-color-text-muted)]">
          Status geral
        </h3>
        <p className="text-[length:var(--ds-font-size-sm)] capitalize text-[var(--ds-color-text-primary)]">
          {DEPENDENCY_GRAPH_STATUS_LABELS[report.status]}
          {report.criticalUnavailableCount > 0
            ? ` · ${report.criticalUnavailableCount} críticas indisponíveis`
            : ""}
          {report.circularDependencyCount > 0
            ? ` · ${report.circularDependencyCount} ciclos`
            : ""}
        </p>
      </div>

      {report.issues.length > 0 ? (
        <div>
          <h3 className="mb-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] uppercase tracking-wide text-[var(--ds-color-text-muted)]">
            Possíveis problemas
          </h3>
          <ul className="space-y-[var(--ds-space-2)]">
            {report.issues.map((issue) => (
              <li
                key={issue.id}
                className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)] text-[length:var(--ds-font-size-xs)]"
              >
                <span className="font-[var(--ds-font-weight-medium)] capitalize text-[var(--ds-color-text-primary)]">
                  {DEPENDENCY_ISSUE_TYPE_LABELS[issue.type]}
                </span>
                <span className="text-[var(--ds-color-text-muted)]"> — {issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <h3 className="mb-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] uppercase tracking-wide text-[var(--ds-color-text-muted)]">
          Dependências
        </h3>
        <table className="w-full min-w-[44rem] text-left text-[length:var(--ds-font-size-xs)]">
          <thead>
            <tr className="border-b border-[var(--ds-color-border-subtle)] text-[var(--ds-color-text-muted)]">
              <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                Origem
              </th>
              <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                Destino
              </th>
              <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                Tipo
              </th>
              <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                Obrigatória
              </th>
              <th className="pb-[var(--ds-space-2)] font-[var(--ds-font-weight-medium)]">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {report.edges.map((dep) => (
              <tr
                key={dep.id}
                className="border-b border-[var(--ds-color-border-subtle)] last:border-0"
              >
                <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-primary)]">
                  {dep.source}
                </td>
                <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-muted)]">
                  {dep.target}
                </td>
                <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] capitalize text-[var(--ds-color-text-muted)]">
                  {DEPENDENCY_TYPE_LABELS[dep.type]}
                </td>
                <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-muted)]">
                  {dep.required ? "Sim" : "Não"}
                </td>
                <td className="py-[var(--ds-space-2)] capitalize text-[var(--ds-color-text-muted)]">
                  {DEPENDENCY_EDGE_STATUS_LABELS[dep.status]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="mb-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] uppercase tracking-wide text-[var(--ds-color-text-muted)]">
          Ordem de carga sugerida
        </h3>
        <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
          {report.loadOrder.join(" → ")}
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
      <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
        {label}
      </p>
      <p
        className={`mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] ${
          highlight ? "text-[var(--ds-color-text-primary)]" : "text-[var(--ds-color-text-primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
