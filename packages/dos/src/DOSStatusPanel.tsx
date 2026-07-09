"use client";

import {
  BOOT_PHASE_LABELS,
  PLATFORM_STATUS_LABELS,
} from "./DOSTypes";
import { useDOS } from "./useDOS";

interface DOSStatusPanelProps {
  emptyMessage?: string;
}

export function DOSStatusPanel({
  emptyMessage = "Douglas Operating System não inicializado.",
}: DOSStatusPanelProps) {
  const { state, health, kernel, isReady, lastBootResult } = useDOS();

  if (!lastBootResult) {
    return (
      <div className="rounded-[var(--ds-radius-md)] border border-dashed border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
        <p className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
          {emptyMessage}
        </p>
      </div>
    );
  }

  const version = kernel.versionManager.getVersion();
  const modules = kernel.moduleManager.getAllModules();
  const plugins = kernel.pluginRegistry.getValidated();
  const diagnostics = kernel.diagnostics.getRecent(5);

  return (
    <section className="space-y-[var(--ds-space-4)]">
      <div>
        <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
          Douglas Operating System
        </p>
        <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
          v{version.dos} · {PLATFORM_STATUS_LABELS[state.status]} ·{" "}
          {isReady ? "operacional" : "não operacional"}
        </p>
      </div>

      <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Boot" value={BOOT_PHASE_LABELS[state.bootPhase]} />
        <StatCard label="Saúde" value={health.status} />
        <StatCard label="Módulos" value={`${state.readyModuleCount}/${state.moduleCount}`} />
        <StatCard label="Plugins" value={`${state.validatedPluginCount}/${state.pluginCount}`} />
      </div>

      <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
        <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] uppercase tracking-[var(--ds-letter-spacing-wide)] text-[var(--ds-color-text-muted)]">
          Módulos carregados
        </p>
        <ul className="mt-[var(--ds-space-2)] space-y-[var(--ds-space-1)]">
          {modules.map((module) => (
            <li
              key={module.id}
              className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]"
            >
              {module.name} · {module.status}
            </li>
          ))}
        </ul>
      </div>

      {plugins.length ? (
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
          <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] uppercase tracking-[var(--ds-letter-spacing-wide)] text-[var(--ds-color-text-muted)]">
            Plugins validados
          </p>
          <ul className="mt-[var(--ds-space-2)] space-y-[var(--ds-space-1)]">
            {plugins.map((plugin) => (
              <li
                key={plugin.id}
                className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]"
              >
                {plugin.name} v{plugin.version}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {diagnostics.length ? (
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
          <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] uppercase tracking-[var(--ds-letter-spacing-wide)] text-[var(--ds-color-text-muted)]">
            Diagnósticos recentes
          </p>
          <ul className="mt-[var(--ds-space-2)] space-y-[var(--ds-space-1)]">
            {diagnostics.map((entry) => (
              <li
                key={entry.id}
                className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]"
              >
                [{entry.level}] {entry.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
      <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
        {label}
      </p>
      <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] capitalize text-[var(--ds-color-text-primary)]">
        {value}
      </p>
    </div>
  );
}
