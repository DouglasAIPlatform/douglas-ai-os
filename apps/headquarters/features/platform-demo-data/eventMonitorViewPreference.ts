import type { EventMonitorViewMode } from "@douglas/monitor";

export const EVENT_MONITOR_VIEW_MODE_STORAGE_KEY =
  "douglas-ai-os:live-event-monitor-view-mode";

export interface EventMonitorDemoViewOption {
  viewMode: EventMonitorViewMode;
  label: string;
  description: string;
}

export const EVENT_MONITOR_DEMO_VIEW_OPTIONS: EventMonitorDemoViewOption[] = [
  {
    viewMode: "all",
    label: "Mostrar demo",
    description: "Exibe eventos demo e reais",
  },
  {
    viewMode: "real-only",
    label: "Ocultar demo",
    description: "Oculta eventos simulados",
  },
  {
    viewMode: "real-only",
    label: "Apenas reais",
    description: "Somente eventos do Event Bus",
  },
  {
    viewMode: "demo-only",
    label: "Apenas demo",
    description: "Somente seeds e ticker mock",
  },
];

const VALID_VIEW_MODES: EventMonitorViewMode[] = ["all", "real-only", "demo-only"];

export function loadPersistedEventMonitorViewMode(): EventMonitorViewMode | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(EVENT_MONITOR_VIEW_MODE_STORAGE_KEY);
    if (!raw) return null;
    if (VALID_VIEW_MODES.includes(raw as EventMonitorViewMode)) {
      return raw as EventMonitorViewMode;
    }
  } catch {
    return null;
  }

  return null;
}

export function savePersistedEventMonitorViewMode(viewMode: EventMonitorViewMode): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(EVENT_MONITOR_VIEW_MODE_STORAGE_KEY, viewMode);
  } catch {
    // ignore quota errors
  }
}

export function getUniqueDemoViewOptions(): Array<{
  viewMode: EventMonitorViewMode;
  labels: string[];
  description: string;
}> {
  const grouped = new Map<EventMonitorViewMode, { labels: string[]; description: string }>();

  for (const option of EVENT_MONITOR_DEMO_VIEW_OPTIONS) {
    const current = grouped.get(option.viewMode);
    if (current) {
      current.labels.push(option.label);
    } else {
      grouped.set(option.viewMode, {
        labels: [option.label],
        description: option.description,
      });
    }
  }

  return [...grouped.entries()].map(([viewMode, value]) => ({
    viewMode,
    labels: value.labels,
    description: value.description,
  }));
}
