import {
  applyEventMonitorFilters,
  countActiveEventMonitorFilters,
  DEFAULT_EVENT_MONITOR_FILTERS,
  type EventMonitorFilters,
} from "./EventMonitorFilters";
import type { EventNoisePolicy } from "./EventNoisePolicy";
import { DEFAULT_EVENT_NOISE_POLICY } from "./EventNoisePolicy";
import type { LiveEvent } from "./MonitorTypes";

export interface EventDisplaySettings {
  filters: EventMonitorFilters;
  displayLimit: number;
  noisePolicy: EventNoisePolicy;
}

export const DEFAULT_EVENT_DISPLAY_SETTINGS: EventDisplaySettings = {
  filters: DEFAULT_EVENT_MONITOR_FILTERS,
  displayLimit: 50,
  noisePolicy: DEFAULT_EVENT_NOISE_POLICY,
};

export interface EventDisplayResult {
  events: LiveEvent[];
  totalCount: number;
  demoCount: number;
  realCount: number;
  filteredCount: number;
  activeFilterCount: number;
}

export function buildEventDisplayResult(
  allEvents: LiveEvent[],
  settings: EventDisplaySettings,
): EventDisplayResult {
  const filtered = applyEventMonitorFilters(allEvents, settings.filters);
  const demoCount = allEvents.filter((event) => event.demo === true).length;

  return {
    events: filtered.slice(0, settings.displayLimit),
    totalCount: allEvents.length,
    demoCount,
    realCount: allEvents.length - demoCount,
    filteredCount: filtered.length,
    activeFilterCount: countActiveEventMonitorFilters(settings.filters),
  };
}
