import type { LiveEvent, MonitorModuleSource } from "./MonitorTypes";
import { MONITOR_MODULE_SOURCES } from "./MonitorTypes";

export function isMonitorModuleSource(value: string): value is MonitorModuleSource {
  return MONITOR_MODULE_SOURCES.includes(value as MonitorModuleSource);
}

export function normalizeMonitorSource(value: string): MonitorModuleSource | string {
  if (isMonitorModuleSource(value)) return value;
  return value;
}

export function createLiveEvent(
  params: Omit<LiveEvent, "id" | "timestamp"> & {
    id?: string;
    timestamp?: string;
    demo?: boolean;
  },
): LiveEvent {
  const demo = params.demo ?? params.metadata?.demo === true;

  return {
    id: params.id ?? `live:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    source: normalizeMonitorSource(String(params.source)),
    type: params.type,
    severity: params.severity,
    message: params.message,
    timestamp: params.timestamp ?? new Date().toISOString(),
    metadata: params.metadata ?? {},
    demo: demo ? true : undefined,
  };
}
