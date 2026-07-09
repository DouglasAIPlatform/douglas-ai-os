import type { Event } from "@douglas/events";
import {
  createLiveEvent,
  EventSeverityResolver,
  type LiveEvent,
  type MonitorModuleSource,
} from "@douglas/monitor";

function mapSource(source: string): MonitorModuleSource | string {
  const known: MonitorModuleSource[] = [
    "core",
    "dos",
    "runtime",
    "brain",
    "agents",
    "missions",
    "workflow",
    "automation",
    "analytics",
    "notifications",
    "plugins",
    "health",
  ];
  if (known.includes(source as MonitorModuleSource)) {
    return source as MonitorModuleSource;
  }
  if (source === "missions" || source === "mission-control") return "missions";
  return source;
}

function buildMessage(event: Event): string {
  const payload = event.payload as unknown as Record<string, unknown>;

  if (event.topic === "system:platform:ready") {
    return `Platform ready — ${String(payload.moduleCount ?? 0)} modules`;
  }
  if (event.topic === "internal:module:ready") {
    return `Module ready: ${String(payload.moduleId ?? "unknown")}`;
  }
  if (event.topic === "internal:module:loaded") {
    return `Module loaded: ${String(payload.moduleId ?? "unknown")}`;
  }
  if (event.topic === "workflow:started") {
    return `Workflow started: ${String(payload.workflowId ?? "")}`;
  }
  if (event.topic === "workflow:completed") {
    return `Workflow ${String(payload.status ?? "completed")}: ${String(payload.workflowId ?? "")}`;
  }
  if (event.topic === "automation:triggered") {
    return `Automation triggered: ${String(payload.automationId ?? "")}`;
  }
  if (event.topic === "automation:completed") {
    return `Automation ${String(payload.status ?? "completed")}`;
  }
  if (event.topic === "system:health:check") {
    return `Health check: ${String(payload.status ?? "unknown")}`;
  }
  if (event.topic === "ai:inference:requested") {
    return `AI inference requested by ${String(payload.agentId ?? "agent")}`;
  }
  if (event.topic === "runtime:action:started") {
    return `Runtime action started: ${String(payload.action ?? "")} on ${String(payload.moduleId ?? "")}`;
  }
  if (event.topic === "runtime:action:completed") {
    return `Runtime action completed: ${String(payload.action ?? "")} (${String(payload.durationMs ?? 0)}ms)`;
  }
  if (event.topic === "runtime:action:failed") {
    return `Runtime action failed: ${String(payload.action ?? "")} — ${String(payload.message ?? "")}`;
  }
  if (event.topic === "diagnostics:report:started") {
    return `Diagnostics report started (${String(payload.reportId ?? "")})`;
  }
  if (event.topic === "diagnostics:report:completed") {
    return `Diagnostics ${String(payload.status ?? "unknown")} — score ${String(payload.score ?? 0)} (${String(payload.durationMs ?? 0)}ms)`;
  }
  if (event.topic === "diagnostics:report:failed") {
    return `Diagnostics failed: ${String(payload.message ?? "unknown error")}`;
  }
  if (event.topic === "security:action:allowed") {
    return `Security allowed: ${String(payload.action ?? "")} on ${String(payload.moduleId ?? "")} (${String(payload.operatorRole ?? "")})`;
  }
  if (event.topic === "security:action:blocked") {
    return `Security blocked: ${String(payload.action ?? "")} — ${String(payload.message ?? "")}`;
  }
  if (event.topic === "security:action:confirmation_requested") {
    return `Security confirmation requested: ${String(payload.action ?? "")} on ${String(payload.moduleId ?? "")} (risk ${String(payload.risk ?? "unknown")})`;
  }
  if (event.topic === "security:action:confirmed") {
    return `Security confirmed: ${String(payload.action ?? "")} by ${String(payload.operatorId ?? "")}`;
  }
  if (event.topic === "security:action:cancelled") {
    return `Security cancelled: ${String(payload.action ?? "")} by ${String(payload.operatorId ?? "")}`;
  }

  return `${event.topic} from ${event.source}`;
}

export function mapBusEventToLiveEvent(event: Event): LiveEvent {
  const payload = event.payload as unknown as Record<string, string | number | boolean | null>;

  return createLiveEvent({
    id: event.id,
    source: mapSource(event.source),
    type: event.topic,
    severity: EventSeverityResolver.fromTopic(event.topic),
    message: buildMessage(event),
    timestamp: event.createdAt,
    demo: false,
    metadata: {
      category: event.category,
      ...(event.metadata.correlationId
        ? { correlationId: event.metadata.correlationId }
        : {}),
      ...(typeof payload.auditId === "string" ? { auditId: payload.auditId } : {}),
      ...(typeof payload.requestId === "string" ? { requestId: payload.requestId } : {}),
      ...(typeof payload.correlationId === "string"
        ? { correlationId: payload.correlationId }
        : {}),
      ...payload,
    },
  });
}
