"use client";

import {
  buildEventDisplayResult,
  DEFAULT_EVENT_MONITOR_FILTERS,
  EVENT_SEVERITY_LABELS,
  getModuleSourceLabel,
  MONITOR_MODULE_SOURCES,
  type EventMonitorFilters,
  type EventMonitorViewMode,
  type EventSeverity,
  useLiveEventMonitor,
} from "@douglas/monitor";
import { toEventNoisePolicy, useDemoData } from "@douglas/demo-data";
import {
  getUniqueDemoViewOptions,
  loadPersistedEventMonitorViewMode,
  savePersistedEventMonitorViewMode,
} from "@/features/platform-demo-data";
import { useEffect, useMemo, useState } from "react";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type LiveEventMonitorWidgetProps = WidgetStateProps;

const SEVERITY_OPTIONS: Array<EventMonitorFilters["severity"]> = [
  "all",
  "critical",
  "error",
  "warning",
  "info",
  "success",
];

function formatTime(iso: string): string {
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

function createInitialFilters(): EventMonitorFilters {
  const persistedViewMode = loadPersistedEventMonitorViewMode();
  return {
    ...DEFAULT_EVENT_MONITOR_FILTERS,
    viewMode: persistedViewMode ?? DEFAULT_EVENT_MONITOR_FILTERS.viewMode,
  };
}

export function LiveEventMonitorWidget({
  isLoading: externalLoading,
  error: externalError,
}: LiveEventMonitorWidgetProps) {
  const { monitor, snapshot } = useLiveEventMonitor();
  const { policy } = useDemoData();
  const [filters, setFilters] = useState<EventMonitorFilters>(createInitialFilters);
  const demoViewOptions = useMemo(() => getUniqueDemoViewOptions(), []);
  const noisePolicy = useMemo(() => toEventNoisePolicy(policy), [policy]);

  useEffect(() => {
    savePersistedEventMonitorViewMode(filters.viewMode);
  }, [filters.viewMode]);

  const display = useMemo(() => {
    const allEvents = monitor.getLog().getAll();
    return buildEventDisplayResult(allEvents, {
      filters,
      displayLimit: 30,
      noisePolicy,
    });
  }, [filters, monitor, noisePolicy, snapshot.totalCount, snapshot.lastEventAt]);

  const isLoading = externalLoading ?? false;
  const error = externalError ?? null;

  const sourceOptions = useMemo(() => {
    const fromLog = new Set(display.events.map((event) => String(event.source)));
    monitor
      .getLog()
      .getAll()
      .forEach((event) => fromLog.add(String(event.source)));
    return [
      "all",
      ...MONITOR_MODULE_SOURCES.filter((source) => fromLog.has(source)),
      ...[...fromLog].filter(
        (source) => !MONITOR_MODULE_SOURCES.includes(source as (typeof MONITOR_MODULE_SOURCES)[number]),
      ),
    ];
  }, [display.events, monitor, snapshot.totalCount]);

  const setViewMode = (viewMode: EventMonitorViewMode) => {
    setFilters((current) => ({ ...current, viewMode }));
  };

  return (
    <WidgetFrame
      title="Live Event Monitor"
      description="Eventos internos — controle demo/real"
      isLoading={isLoading}
      error={error}
      isEmpty={!display.events.length && !isLoading}
      emptyTitle="Nenhum evento corresponde aos filtros"
      emptyDescription="Ajuste os filtros ou aguarde novos eventos."
      footer={
        snapshot.lastEventAt
          ? `${display.totalCount} total (${display.realCount} reais · ${display.demoCount} demo) · modo ${policy.mode} · exibindo ${display.events.length}/${display.filteredCount}`
          : undefined
      }
    >
      <div className="space-y-[var(--ds-space-4)]">
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
          <p className="mb-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
            Exibição demo/real
          </p>
          <div className="flex flex-wrap gap-[var(--ds-space-2)]">
            {demoViewOptions.map((option) => {
              const isActive = filters.viewMode === option.viewMode;
              return (
                <button
                  key={option.viewMode}
                  type="button"
                  title={option.description}
                  onClick={() => setViewMode(option.viewMode)}
                  className={`rounded-[var(--ds-radius-md)] border px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] ${
                    isActive
                      ? "border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-default)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]"
                      : "border-transparent bg-transparent text-[var(--ds-color-text-muted)] hover:bg-[var(--ds-color-surface-default)]"
                  }`}
                >
                  {option.labels.join(" / ")}
                </button>
              );
            })}
          </div>
          <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Preferência salva em localStorage
          </p>
        </div>

        <div className="flex flex-wrap gap-[var(--ds-space-3)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
          <FilterSelect
            label="Severidade"
            value={filters.severity}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                severity: value as EventMonitorFilters["severity"],
              }))
            }
            options={SEVERITY_OPTIONS.map((severity) => ({
              value: severity,
              label: severity === "all" ? "Todas" : EVENT_SEVERITY_LABELS[severity as EventSeverity],
            }))}
          />
          <FilterSelect
            label="Origem"
            value={filters.source}
            onChange={(value) => setFilters((current) => ({ ...current, source: value }))}
            options={sourceOptions.map((source) => ({
              value: source,
              label: source === "all" ? "Todas" : getModuleSourceLabel(source),
            }))}
          />
          {display.activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={() =>
                setFilters({
                  ...DEFAULT_EVENT_MONITOR_FILTERS,
                  viewMode: filters.viewMode,
                })
              }
              className="self-end rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)] hover:bg-[var(--ds-color-surface-default)]"
            >
              Limpar filtros
            </button>
          ) : null}
        </div>

        <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
          Demo ingestão: seeds {policy.enableDemoSeeds ? "on" : "off"} · ticker{" "}
          {policy.enableDemoTicker ? "on" : "off"} · widgets mock{" "}
          {policy.enableDemoWidgets ? "on" : "off"}
        </p>

        <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-4">
          <Stat label="Total" value={String(display.totalCount)} />
          <Stat label="Filtrados" value={String(display.filteredCount)} />
          <Stat label="Reais" value={String(display.realCount)} />
          <Stat label="Demo" value={String(display.demoCount)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-[length:var(--ds-font-size-xs)]">
            <thead>
              <tr className="border-b border-[var(--ds-color-border-subtle)] text-[var(--ds-color-text-muted)]">
                <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                  Horário
                </th>
                <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                  Origem
                </th>
                <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                  Severidade
                </th>
                <th className="pb-[var(--ds-space-2)] font-[var(--ds-font-weight-medium)]">
                  Mensagem
                </th>
              </tr>
            </thead>
            <tbody>
              {display.events.map((event) => (
                <tr
                  key={event.id}
                  className={`border-b border-[var(--ds-color-border-subtle)] last:border-0 ${
                    event.demo ? "opacity-60" : ""
                  }`}
                >
                  <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] whitespace-nowrap text-[var(--ds-color-text-muted)]">
                    {formatTime(event.timestamp)}
                  </td>
                  <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-primary)]">
                    {getModuleSourceLabel(String(event.source))}
                  </td>
                  <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] capitalize text-[var(--ds-color-text-muted)]">
                    {EVENT_SEVERITY_LABELS[event.severity]}
                  </td>
                  <td className="py-[var(--ds-space-2)] text-[var(--ds-color-text-muted)]">
                    <span className={event.demo ? "italic" : ""}>{event.message}</span>
                    {event.demo ? (
                      <span
                        title="Evento simulado (seed ou ticker mock) — não representa ação real da plataforma"
                        className="ml-[var(--ds-space-2)] rounded-[var(--ds-radius-sm)] border border-dashed border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] uppercase tracking-wide text-[var(--ds-color-text-muted)]"
                      >
                        Demo
                      </span>
                    ) : null}
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

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex min-w-[8rem] flex-col gap-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-default)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[var(--ds-color-text-primary)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
      <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
        {label}
      </p>
      <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
        {value}
      </p>
    </div>
  );
}
