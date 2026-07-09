export type EventMonitorViewMode = "all" | "real-only" | "demo-only";

export const EVENT_MONITOR_VIEW_MODE_LABELS: Record<EventMonitorViewMode, string> = {
  all: "Todos os eventos",
  "real-only": "Apenas reais",
  "demo-only": "Apenas demo",
};

/** Alias legível para ocultar eventos demo (= real-only). */
export const HIDE_DEMO_VIEW_MODE: EventMonitorViewMode = "real-only";
