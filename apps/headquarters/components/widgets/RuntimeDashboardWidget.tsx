"use client";

import {
  PLATFORM_RUNTIME_STATUS_LABELS,
  RUNTIME_HEALTH_LABELS,
  RUNTIME_MODULE_STATUS_LABELS,
  usePlatformRuntime,
} from "@douglas/runtime";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type RuntimeDashboardWidgetProps = WidgetStateProps;

function formatUptime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function RuntimeDashboardWidget({
  isLoading: externalLoading,
  error: externalError,
}: RuntimeDashboardWidgetProps) {
  const { state, monitorReport, isStarting, isRunning } = usePlatformRuntime();

  const isLoading = externalLoading ?? isStarting;
  const error =
    externalError ??
    (state.status === "failed" ? "Runtime da plataforma falhou." : null);

  return (
    <WidgetFrame
      title="Runtime Dashboard"
      description="Platform Runtime — módulos vivos durante a execução"
      isLoading={isLoading}
      error={error}
      isEmpty={!state.modules.length && !isLoading}
      emptyTitle="Runtime não iniciado"
      emptyDescription="Aguardando conclusão do bootstrap."
      footer={
        isRunning
          ? `Uptime ${formatUptime(state.uptimeMs)} · ${PLATFORM_RUNTIME_STATUS_LABELS[state.status]}`
          : undefined
      }
    >
      <div className="space-y-[var(--ds-space-4)]">
        <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Módulos"
            value={`${state.readyModuleCount}/${state.totalModuleCount}`}
          />
          <Stat label="Uptime" value={formatUptime(state.uptimeMs)} />
          <Stat
            label="Health"
            value={RUNTIME_HEALTH_LABELS[monitorReport?.status ?? state.health]}
          />
          <Stat label="Status" value={PLATFORM_RUNTIME_STATUS_LABELS[state.status]} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-[length:var(--ds-font-size-xs)]">
            <thead>
              <tr className="border-b border-[var(--ds-color-border-subtle)] text-[var(--ds-color-text-muted)]">
                <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                  Módulo
                </th>
                <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                  Status
                </th>
                <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                  Versão
                </th>
                <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                  Uptime
                </th>
                <th className="pb-[var(--ds-space-2)] font-[var(--ds-font-weight-medium)]">
                  Health
                </th>
              </tr>
            </thead>
            <tbody>
              {state.modules.map((module) => (
                <tr
                  key={module.id}
                  className="border-b border-[var(--ds-color-border-subtle)] last:border-0"
                >
                  <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-primary)]">
                    {module.name}
                  </td>
                  <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] capitalize text-[var(--ds-color-text-muted)]">
                    {RUNTIME_MODULE_STATUS_LABELS[module.status]}
                  </td>
                  <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-muted)]">
                    v{module.version}
                  </td>
                  <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-muted)]">
                    {formatUptime(module.uptimeMs)}
                  </td>
                  <td className="py-[var(--ds-space-2)] capitalize text-[var(--ds-color-text-muted)]">
                    {RUNTIME_HEALTH_LABELS[module.health]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </WidgetFrame>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
      <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
        {label}
      </p>
      <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] capitalize text-[var(--ds-color-text-primary)]">
        {value}
      </p>
    </div>
  );
}
