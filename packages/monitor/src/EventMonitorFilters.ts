import type { EventMonitorViewMode } from "./EventMonitorViewMode";
import type { EventFilterCriteria, EventSeverity, LiveEvent } from "./MonitorTypes";

export type EventMonitorSeverityFilter = EventSeverity | "all";

export type EventMonitorSourceFilter = string | "all";

export interface EventMonitorFilters {
  viewMode: EventMonitorViewMode;
  severity: EventMonitorSeverityFilter;
  source: EventMonitorSourceFilter;
}

export const DEFAULT_EVENT_MONITOR_FILTERS: EventMonitorFilters = {
  viewMode: "all",
  severity: "all",
  source: "all",
};

export function applyEventMonitorFilters(
  events: LiveEvent[],
  filters: EventMonitorFilters,
): LiveEvent[] {
  return events.filter((event) => matchesEventMonitorFilters(event, filters));
}

export function matchesEventMonitorFilters(
  event: LiveEvent,
  filters: EventMonitorFilters,
): boolean {
  if (filters.viewMode === "real-only" && event.demo === true) {
    return false;
  }

  if (filters.viewMode === "demo-only" && event.demo !== true) {
    return false;
  }

  if (filters.severity !== "all" && event.severity !== filters.severity) {
    return false;
  }

  if (filters.source !== "all" && String(event.source) !== filters.source) {
    return false;
  }

  return true;
}

export function eventMonitorFiltersToCriteria(
  filters: EventMonitorFilters,
): EventFilterCriteria {
  const criteria: EventFilterCriteria = {};

  if (filters.viewMode === "real-only") {
    criteria.excludeDemo = true;
  }

  if (filters.severity !== "all") {
    criteria.severity = filters.severity;
  }

  if (filters.source !== "all") {
    criteria.source = filters.source;
  }

  return criteria;
}

export function countActiveEventMonitorFilters(filters: EventMonitorFilters): number {
  let count = 0;
  if (filters.viewMode !== "all") count += 1;
  if (filters.severity !== "all") count += 1;
  if (filters.source !== "all") count += 1;
  return count;
}
