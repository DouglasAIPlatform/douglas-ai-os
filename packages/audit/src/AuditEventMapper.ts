import type { Event } from "@douglas/events";
import type { EventTopic } from "@douglas/events";
import { resolveAuditActor } from "./AuditActorResolver";
import type { AuditAction, AuditEntry, AuditSeverity, AuditSource } from "./AuditTypes";

export interface AuditMapperState {
  lastReadinessStatus: string | null;
  lastReadinessReady: boolean | null;
}

export function createAuditMapperState(): AuditMapperState {
  return {
    lastReadinessStatus: null,
    lastReadinessReady: null,
  };
}

function asRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object") {
    return payload as Record<string, unknown>;
  }
  return {};
}

function resolveCorrelation(
  event: Event,
  payload: Record<string, unknown>,
): string | undefined {
  const fromMetadata = event.metadata?.correlationId;
  if (typeof fromMetadata === "string" && fromMetadata.length > 0) {
    return fromMetadata;
  }

  const fromPayload = payload.correlationId ?? payload.requestId;
  if (typeof fromPayload === "string" && fromPayload.length > 0) {
    return fromPayload;
  }

  return undefined;
}

function buildCorrelationMetadata(
  event: Event,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const correlationId = resolveCorrelation(event, payload);
  const metadata: Record<string, unknown> = {};

  if (payload.auditId) metadata.auditId = payload.auditId;
  if (payload.requestId) metadata.requestId = payload.requestId;
  if (correlationId) metadata.correlationId = correlationId;

  return metadata;
}

function baseEntry(
  event: Event,
  action: AuditAction,
  source: AuditSource,
  severity: AuditSeverity,
  target: string,
  actor: string,
  role: string,
  message: string,
  metadata: Record<string, unknown> = {},
): Omit<AuditEntry, "id" | "timestamp"> {
  return {
    actor,
    role,
    source,
    action,
    target,
    severity,
    message,
    metadata: {
      eventId: event.id,
      topic: event.topic,
      ...metadata,
    },
  };
}

function mapAuthOperatorHandoffEvent(
  event: Event<EventTopic>,
): Omit<AuditEntry, "id" | "timestamp"> | null {
  const payload = asRecord(event.payload);
  const userId = payload.userId ? String(payload.userId) : undefined;
  const operatorId = payload.operatorId ? String(payload.operatorId) : undefined;
  const operatorRole = String(payload.operatorRole ?? "unknown");
  const resolved = resolveAuditActor(operatorId ?? userId, operatorRole);
  const handoffState = String(payload.handoffState ?? "unknown");
  const message =
    typeof payload.message === "string"
      ? payload.message
      : `${event.topic} · ${handoffState}`;

  const actionByTopic: Record<string, AuditAction> = {
    "auth:operator:handoff_started": "auth_handoff_started",
    "auth:operator:handoff_completed": "auth_handoff_completed",
    "auth:operator:handoff_fallback": "auth_handoff_fallback",
    "auth:operator:handoff_failed": "auth_handoff_failed",
  };

  const action = actionByTopic[event.topic];
  if (!action) return null;

  const severity: AuditSeverity =
    event.topic === "auth:operator:handoff_failed" ? "warning" : "info";

  return baseEntry(
    event,
    action,
    "authentication",
    severity,
    "operator_handoff",
    resolved.actor,
    resolved.role,
    message,
    {
      handoffState,
      operatorSource: payload.operatorSource,
      actorId: resolved.actorId,
      userId,
    },
  );
}

function mapSecurityEvent(event: Event<EventTopic>): Omit<AuditEntry, "id" | "timestamp"> | null {
  const payload = asRecord(event.payload);
  const actorId = payload.operatorId ? String(payload.operatorId) : undefined;
  const operatorName =
    typeof payload.operatorName === "string" ? payload.operatorName : undefined;
  const resolved = resolveAuditActor(actorId, String(payload.operatorRole ?? "unknown"), operatorName);
  const moduleId = String(payload.moduleId ?? "unknown-module");
  const actionName = String(payload.action ?? "unknown");
  const message = String(payload.message ?? `${event.topic} on ${moduleId}`);
  const correlation = buildCorrelationMetadata(event, payload);

  switch (event.topic) {
    case "security:action:allowed":
      return baseEntry(
        event,
        "action_allowed",
        "security",
        "info",
        moduleId,
        resolved.actor,
        resolved.role,
        message,
        {
          ...correlation,
          securedAction: actionName,
          actorId: resolved.actorId,
        },
      );
    case "security:action:blocked":
      return baseEntry(
        event,
        "action_blocked",
        "security",
        "warning",
        moduleId,
        resolved.actor,
        resolved.role,
        message,
        {
          ...correlation,
          securedAction: actionName,
          actorId: resolved.actorId,
        },
      );
    case "security:action:confirmation_requested":
      return baseEntry(
        event,
        "action_confirmation_requested",
        "security",
        "info",
        moduleId,
        resolved.actor,
        resolved.role,
        message,
        {
          ...correlation,
          securedAction: actionName,
          actorId: resolved.actorId,
          risk: payload.risk,
        },
      );
    case "security:action:confirmed":
      return baseEntry(
        event,
        "action_confirmed",
        "security",
        "info",
        moduleId,
        resolved.actor,
        resolved.role,
        message,
        {
          ...correlation,
          securedAction: actionName,
          actorId: resolved.actorId,
        },
      );
    case "security:action:cancelled":
      return baseEntry(
        event,
        "action_cancelled",
        "security",
        "info",
        moduleId,
        resolved.actor,
        resolved.role,
        message,
        {
          ...correlation,
          securedAction: actionName,
          actorId: resolved.actorId,
        },
      );
    default:
      return null;
  }
}

function mapRuntimeEvent(event: Event<EventTopic>): Omit<AuditEntry, "id" | "timestamp"> | null {
  const payload = asRecord(event.payload);
  const moduleId = String(payload.moduleId ?? "unknown-module");
  const runtimeAction = String(payload.action ?? "unknown");
  const message = String(payload.message ?? `${event.topic} — ${runtimeAction}`);
  const correlation = buildCorrelationMetadata(event, payload);
  const resolved = resolveAuditActor("runtime", "system");

  switch (event.topic) {
    case "runtime:action:started":
      return baseEntry(
        event,
        "runtime_action_started",
        "runtime",
        "info",
        moduleId,
        resolved.actor,
        resolved.role,
        message,
        {
          ...correlation,
          runtimeAction,
          commandId: payload.commandId,
          actorId: "runtime",
        },
      );
    case "runtime:action:completed":
      return baseEntry(
        event,
        "runtime_action_completed",
        "runtime",
        "info",
        moduleId,
        resolved.actor,
        resolved.role,
        message,
        {
          ...correlation,
          runtimeAction,
          commandId: payload.commandId,
          success: payload.success,
          durationMs: payload.durationMs,
          actorId: "runtime",
        },
      );
    case "runtime:action:failed":
      return baseEntry(
        event,
        "runtime_action_failed",
        "runtime",
        "error",
        moduleId,
        resolved.actor,
        resolved.role,
        message,
        {
          ...correlation,
          runtimeAction,
          commandId: payload.commandId,
          actorId: "runtime",
        },
      );
    default:
      return null;
  }
}

function mapDiagnosticsEvent(
  event: Event<EventTopic>,
  state: AuditMapperState,
): { entries: Array<Omit<AuditEntry, "id" | "timestamp">>; state: AuditMapperState } {
  const payload = asRecord(event.payload);
  const entries: Array<Omit<AuditEntry, "id" | "timestamp">> = [];
  const nextState = { ...state };
  const resolved = resolveAuditActor("diagnostics", "system");
  const correlation = buildCorrelationMetadata(event, payload);

  if (event.topic === "diagnostics:report:failed") {
    entries.push(
      baseEntry(
        event,
        "diagnostics_critical_issue",
        "diagnostics",
        "critical",
        "platform",
        resolved.actor,
        resolved.role,
        String(payload.message ?? "Diagnostics report failed"),
        {
          ...correlation,
          reportId: payload.reportId,
          status: payload.status,
          actorId: "diagnostics",
        },
      ),
    );
    return { entries, state: nextState };
  }

  if (event.topic !== "diagnostics:report:completed") {
    return { entries, state: nextState };
  }

  const status = String(payload.status ?? "unknown");
  const ready = payload.ready === true;
  const score = payload.score;
  const reportId = payload.reportId;
  const platformActor = resolveAuditActor("platform-state", "system");

  if (status === "not_ready" || ready === false) {
    entries.push(
      baseEntry(
        event,
        "diagnostics_critical_issue",
        "diagnostics",
        "critical",
        "platform",
        resolved.actor,
        resolved.role,
        String(payload.message ?? `Platform not ready — status ${status}`),
        {
          ...correlation,
          reportId,
          status,
          score,
          ready,
          actorId: "diagnostics",
        },
      ),
    );
  }

  const statusChanged =
    nextState.lastReadinessStatus !== null && nextState.lastReadinessStatus !== status;
  const readyChanged =
    nextState.lastReadinessReady !== null && nextState.lastReadinessReady !== ready;

  if (statusChanged || readyChanged) {
    entries.push(
      baseEntry(
        event,
        "readiness_status_changed",
        "platform",
        status === "not_ready" ? "critical" : status === "degraded" ? "warning" : "info",
        "platform",
        platformActor.actor,
        platformActor.role,
        `Readiness ${nextState.lastReadinessStatus ?? "?"} → ${status} (ready: ${String(ready)})`,
        {
          ...correlation,
          reportId,
          previousStatus: nextState.lastReadinessStatus,
          previousReady: nextState.lastReadinessReady,
          status,
          ready,
          score,
          actorId: "platform-state",
        },
      ),
    );
  }

  nextState.lastReadinessStatus = status;
  nextState.lastReadinessReady = ready;

  return { entries, state: nextState };
}

export function mapEventToAuditEntries(
  event: Event,
  state: AuditMapperState,
): { entries: Array<Omit<AuditEntry, "id" | "timestamp">>; state: AuditMapperState } {
  if (event.topic.startsWith("security:action:")) {
    const entry = mapSecurityEvent(event);
    return { entries: entry ? [entry] : [], state };
  }

  if (event.topic.startsWith("auth:operator:handoff_")) {
    const entry = mapAuthOperatorHandoffEvent(event);
    return { entries: entry ? [entry] : [], state };
  }

  if (event.topic.startsWith("runtime:action:")) {
    const entry = mapRuntimeEvent(event);
    return { entries: entry ? [entry] : [], state };
  }

  if (event.topic.startsWith("diagnostics:report:")) {
    return mapDiagnosticsEvent(event, state);
  }

  return { entries: [], state };
}

export function isAuditedEventTopic(topic: string): boolean {
  return (
    topic.startsWith("security:action:") ||
    topic.startsWith("auth:operator:handoff_") ||
    topic.startsWith("runtime:action:") ||
    topic.startsWith("diagnostics:report:")
  );
}

export function getAuditCorrelationRef(entry: AuditEntry): string | null {
  const metadata = entry.metadata;
  if (typeof metadata.correlationId === "string") return metadata.correlationId;
  if (typeof metadata.requestId === "string") return metadata.requestId;
  if (typeof metadata.auditId === "string") return metadata.auditId;
  return null;
}

export function isAuditEntryPersistedLocally(entry: AuditEntry): boolean {
  return entry.metadata.persistedLocally === true;
}
