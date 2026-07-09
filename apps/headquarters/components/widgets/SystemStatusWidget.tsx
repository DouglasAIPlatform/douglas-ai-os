"use client";

import {
  BOOTSTRAP_HEALTH_LABELS,
  BOOTSTRAP_STATUS_LABELS,
  PLATFORM_BOOT_STATUS_LABELS,
  usePlatformBootstrap,
} from "@douglas/bootstrap";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type SystemStatusWidgetProps = WidgetStateProps;

export function SystemStatusWidget({
  isLoading: externalLoading,
  error: externalError,
}: SystemStatusWidgetProps) {
  const { state, health, startupReport, isBooting } = usePlatformBootstrap();

  const isLoading = externalLoading ?? isBooting;
  const error = externalError ?? (state.status === "failed" ? "Boot da plataforma falhou." : null);

  return (
    <WidgetFrame
      title="System Status"
      description="Platform Bootstrap — estado global da plataforma"
      isLoading={isLoading}
      error={error}
      isEmpty={!state.modules.length && !isLoading}
      emptyTitle="Plataforma não inicializada"
      emptyDescription="Aguardando conclusão do boot."
      footer={
        startupReport
          ? `Boot ${startupReport.bootDurationMs}ms · ${PLATFORM_BOOT_STATUS_LABELS[state.status]}`
          : undefined
      }
    >
      <div className="space-y-[var(--ds-space-4)]">
        <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Módulos" value={`${state.readyModuleCount}/${state.totalModuleCount}`} />
          <Stat label="Boot" value={`${state.bootDurationMs}ms`} />
          <Stat label="Health" value={BOOTSTRAP_HEALTH_LABELS[health.status]} />
          <Stat label="Versão" value={state.platformVersion} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-[length:var(--ds-font-size-xs)]">
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
                  Init
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
                    {BOOTSTRAP_STATUS_LABELS[module.status]}
                  </td>
                  <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-muted)]">
                    v{module.version}
                  </td>
                  <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-muted)]">
                    {module.initTimeMs}ms
                  </td>
                  <td className="py-[var(--ds-space-2)] capitalize text-[var(--ds-color-text-muted)]">
                    {BOOTSTRAP_HEALTH_LABELS[module.health]}
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
