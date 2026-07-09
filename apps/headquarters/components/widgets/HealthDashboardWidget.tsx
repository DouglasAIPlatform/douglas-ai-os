"use client";

import {
  HEALTH_MODULE_STATUS_LABELS,
  PLATFORM_HEALTH_STATUS_LABELS,
  useSystemHealth,
} from "@douglas/health";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type HealthDashboardWidgetProps = WidgetStateProps;

function formatCheckedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function HealthDashboardWidget({
  isLoading: externalLoading,
  error: externalError,
}: HealthDashboardWidgetProps) {
  const { report, isEvaluating, isMonitoring } = useSystemHealth();

  const isLoading = externalLoading ?? isEvaluating;
  const error =
    externalError ??
    (report?.status === "critical" && report.criticalCount === report.moduleCount
      ? "Todos os módulos estão críticos ou offline."
      : null);

  return (
    <WidgetFrame
      title="Health Dashboard"
      description="System Health Engine — saúde dos módulos da plataforma"
      isLoading={isLoading}
      error={error}
      isEmpty={!report && !isLoading}
      emptyTitle="Health Engine não iniciado"
      emptyDescription="Aguardando bootstrap e runtime."
      footer={
        report
          ? `Último check ${formatCheckedAt(report.lastCheckedAt)} · ${isMonitoring ? "Monitorando" : "Parado"}`
          : undefined
      }
    >
      {report ? (
        <div className="space-y-[var(--ds-space-4)]">
          <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2 lg:grid-cols-5">
            <Stat
              label="Status geral"
              value={PLATFORM_HEALTH_STATUS_LABELS[report.status]}
              highlight={report.status !== "healthy"}
            />
            <Stat label="Saudáveis" value={String(report.healthyCount)} />
            <Stat
              label="Alertas"
              value={String(report.warningCount)}
              highlight={report.warningCount > 0}
            />
            <Stat
              label="Críticos"
              value={String(report.criticalCount)}
              highlight={report.criticalCount > 0}
            />
            <Stat label="Offline" value={String(report.offlineCount)} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-[length:var(--ds-font-size-xs)]">
              <thead>
                <tr className="border-b border-[var(--ds-color-border-subtle)] text-[var(--ds-color-text-muted)]">
                  <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                    Módulo
                  </th>
                  <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                    Status
                  </th>
                  <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                    Mensagem
                  </th>
                  <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                    Issues
                  </th>
                  <th className="pb-[var(--ds-space-2)] font-[var(--ds-font-weight-medium)]">
                    Último check
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.modules.map((module) => (
                  <tr
                    key={module.moduleId}
                    className="border-b border-[var(--ds-color-border-subtle)] last:border-0"
                  >
                    <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-primary)]">
                      {module.moduleName}
                    </td>
                    <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] capitalize text-[var(--ds-color-text-muted)]">
                      {HEALTH_MODULE_STATUS_LABELS[module.status]}
                    </td>
                    <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-muted)]">
                      {module.message}
                    </td>
                    <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-muted)]">
                      {module.issues.length}
                    </td>
                    <td className="py-[var(--ds-space-2)] text-[var(--ds-color-text-muted)]">
                      {formatCheckedAt(module.lastCheckedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </WidgetFrame>
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
        className={`mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] capitalize ${
          highlight
            ? "text-[var(--ds-color-text-primary)]"
            : "text-[var(--ds-color-text-primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
