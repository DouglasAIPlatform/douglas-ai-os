import type { EventSeverity, MonitorModuleSource } from "./MonitorTypes";
import { EVENT_SEVERITY_LABELS, MONITOR_MODULE_SOURCE_LABELS } from "./MonitorTypes";

export function isEventSeverity(value: string): value is EventSeverity {
  return value in EVENT_SEVERITY_LABELS;
}

export function compareSeverity(left: EventSeverity, right: EventSeverity): number {
  const order: Record<EventSeverity, number> = {
    critical: 0,
    error: 1,
    warning: 2,
    info: 3,
    success: 4,
  };
  return order[left] - order[right];
}

export function getModuleSourceLabel(source: string): string {
  if (source in MONITOR_MODULE_SOURCE_LABELS) {
    return MONITOR_MODULE_SOURCE_LABELS[source as MonitorModuleSource];
  }
  return source;
}

export class EventSeverityResolver {
  static fromTopic(topic: string): EventSeverity {
    if (topic.includes("failed") || topic.includes("error")) return "error";
    if (topic === "runtime:action:failed") return "error";
    if (topic.includes("critical")) return "critical";
    if (topic.includes("warning") || topic.includes("degraded")) return "warning";
    if (
      topic.includes("completed") ||
      topic.includes("ready") ||
      topic.includes("published") ||
      topic === "runtime:action:completed"
    ) {
      return "success";
    }
    if (topic === "runtime:action:started") return "info";
    return "info";
  }

  static escalate(severity: EventSeverity): EventSeverity {
    const order: EventSeverity[] = ["success", "info", "warning", "error", "critical"];
    const index = order.indexOf(severity);
    return order[Math.min(index + 1, order.length - 1)] ?? severity;
  }
}
