import type {
  AuthOperatorHandoffEventPayload,
  ReadinessStatus,
  RuntimeActionType,
  SecurityActionEventPayload,
} from "./OperationalEventTypes";

export type {
  ActionConfirmationRiskLevel,
  AuthOperatorHandoffEventTopic,
  AuthOperatorHandoffState,
  AuthOperatorRoleSource,
  AuthOperatorHandoffEventPayload,
  DiagnosticsReportEventTopic,
  OperatorRole,
  ReadinessStatus,
  RuntimeActionEventTopic,
  RuntimeActionType,
  SecuredActionType,
  SecurityActionEventPayload,
  SecurityActionEventTopic,
} from "./OperationalEventTypes";

export {
  AUTH_OPERATOR_HANDOFF_EVENT_TOPICS,
  DIAGNOSTICS_REPORT_EVENT_TOPICS,
  OPERATIONAL_EVENT_TOPIC_PATTERN,
  RUNTIME_ACTION_EVENT_TOPICS,
  SECURITY_ACTION_EVENT_TOPICS,
} from "./OperationalEventTypes";

export type EventCategory =
  | "internal"
  | "system"
  | "runtime"
  | "diagnostics"
  | "security"
  | "ai"
  | "workflow"
  | "automation"
  | "calma"
  | "youtube";

export type EventSource =
  | "core"
  | "brain"
  | "agents"
  | "automation"
  | "memory"
  | "workflow"
  | "search"
  | "notifications"
  | "analytics"
  | "authentication"
  | "calma"
  | "youtube"
  | (string & {});

export interface SystemPlatformReadyPayload {
  platformVersion: string;
  moduleCount: number;
}

export interface SystemHealthCheckPayload {
  status: "healthy" | "degraded" | "unhealthy";
}

export interface InternalModuleLoadedPayload {
  moduleId: string;
  version: string;
}

export interface InternalModuleReadyPayload {
  moduleId: string;
}

export interface AiInferenceRequestedPayload {
  agentId: string;
  adapterId: string;
  promptRef?: string;
}

export interface AiInferenceCompletedPayload {
  agentId: string;
  adapterId: string;
  success: boolean;
}

export interface WorkflowStartedPayload {
  workflowId: string;
  executionId: string;
}

export interface WorkflowCompletedPayload {
  workflowId: string;
  executionId: string;
  status: "completed" | "failed" | "cancelled";
}

export interface AutomationTriggeredPayload {
  automationId: string;
  triggerType: string;
}

export interface AutomationCompletedPayload {
  automationId: string;
  runId: string;
  status: "completed" | "failed" | "cancelled";
}

export interface CalmaSessionStartedPayload {
  sessionId: string;
  userId: string;
}

export interface CalmaMindfulnessCompletedPayload {
  sessionId: string;
  durationMinutes: number;
}

export interface YouTubeVideoPublishedPayload {
  videoId: string;
  channelId: string;
  title: string;
}

export interface YouTubeUploadStartedPayload {
  videoId: string;
  projectId: string;
}

export interface RuntimeActionEventPayload {
  commandId: string;
  moduleId: string;
  action: RuntimeActionType;
  message?: string;
  success?: boolean;
  durationMs?: number;
}

export interface DiagnosticsReportEventPayload {
  reportId: string;
  ready: boolean;
  score: number;
  status: ReadinessStatus;
  message?: string;
  durationMs?: number;
}

/** Telemetria de ingest remoto — sem PII (Sprint 5.36). */
export interface AuditIngestTelemetryEventPayload {
  outcome: "accepted" | "rejected" | "fallback" | "failed";
  auditId?: string;
  requestId?: string;
  correlationId?: string;
  errorCode?: string;
  latencyMs?: number;
  remoteStatus?: "accepted" | "rejected" | "error";
}

/**
 * Mapa central de eventos tipados da Douglas AI Platform.
 * Novos módulos estendem este mapa via module augmentation.
 */
export interface DouglasEventMap {
  "system:platform:ready": SystemPlatformReadyPayload;
  "system:health:check": SystemHealthCheckPayload;
  "internal:module:loaded": InternalModuleLoadedPayload;
  "internal:module:ready": InternalModuleReadyPayload;
  "ai:inference:requested": AiInferenceRequestedPayload;
  "ai:inference:completed": AiInferenceCompletedPayload;
  "workflow:started": WorkflowStartedPayload;
  "workflow:completed": WorkflowCompletedPayload;
  "automation:triggered": AutomationTriggeredPayload;
  "automation:completed": AutomationCompletedPayload;
  "calma:session:started": CalmaSessionStartedPayload;
  "calma:mindfulness:completed": CalmaMindfulnessCompletedPayload;
  "youtube:video:published": YouTubeVideoPublishedPayload;
  "youtube:upload:started": YouTubeUploadStartedPayload;
  "runtime:action:started": RuntimeActionEventPayload;
  "runtime:action:completed": RuntimeActionEventPayload;
  "runtime:action:failed": RuntimeActionEventPayload;
  "diagnostics:report:started": DiagnosticsReportEventPayload;
  "diagnostics:report:completed": DiagnosticsReportEventPayload;
  "diagnostics:report:failed": DiagnosticsReportEventPayload;
  "security:action:allowed": SecurityActionEventPayload;
  "security:action:blocked": SecurityActionEventPayload;
  "security:action:confirmation_requested": SecurityActionEventPayload;
  "security:action:confirmed": SecurityActionEventPayload;
  "security:action:cancelled": SecurityActionEventPayload;
  "auth:operator:handoff_started": AuthOperatorHandoffEventPayload;
  "auth:operator:handoff_completed": AuthOperatorHandoffEventPayload;
  "auth:operator:handoff_fallback": AuthOperatorHandoffEventPayload;
  "auth:operator:handoff_failed": AuthOperatorHandoffEventPayload;
  "audit:ingest:accepted": AuditIngestTelemetryEventPayload;
  "audit:ingest:rejected": AuditIngestTelemetryEventPayload;
  "audit:ingest:fallback": AuditIngestTelemetryEventPayload;
  "audit:ingest:failed": AuditIngestTelemetryEventPayload;
}

export type EventTopic = keyof DouglasEventMap;

export type EventPayload<TTopic extends EventTopic> = DouglasEventMap[TTopic];

export const EVENT_CATEGORIES: Record<EventCategory, EventTopic[]> = {
  internal: [
    "internal:module:loaded",
    "internal:module:ready",
    "audit:ingest:accepted",
    "audit:ingest:rejected",
    "audit:ingest:fallback",
    "audit:ingest:failed",
  ],
  system: ["system:platform:ready", "system:health:check"],
  runtime: [
    "runtime:action:started",
    "runtime:action:completed",
    "runtime:action:failed",
  ],
  diagnostics: [
    "diagnostics:report:started",
    "diagnostics:report:completed",
    "diagnostics:report:failed",
  ],
  security: [
    "security:action:allowed",
    "security:action:blocked",
    "security:action:confirmation_requested",
    "security:action:confirmed",
    "security:action:cancelled",
    "auth:operator:handoff_started",
    "auth:operator:handoff_completed",
    "auth:operator:handoff_fallback",
    "auth:operator:handoff_failed",
  ],
  ai: ["ai:inference:requested", "ai:inference:completed"],
  workflow: ["workflow:started", "workflow:completed"],
  automation: ["automation:triggered", "automation:completed"],
  calma: ["calma:session:started", "calma:mindfulness:completed"],
  youtube: ["youtube:video:published", "youtube:upload:started"],
};

export const TOPIC_CATEGORY: Record<EventTopic, EventCategory> = {
  "system:platform:ready": "system",
  "system:health:check": "system",
  "internal:module:loaded": "internal",
  "internal:module:ready": "internal",
  "ai:inference:requested": "ai",
  "ai:inference:completed": "ai",
  "workflow:started": "workflow",
  "workflow:completed": "workflow",
  "automation:triggered": "automation",
  "automation:completed": "automation",
  "calma:session:started": "calma",
  "calma:mindfulness:completed": "calma",
  "youtube:video:published": "youtube",
  "youtube:upload:started": "youtube",
  "runtime:action:started": "runtime",
  "runtime:action:completed": "runtime",
  "runtime:action:failed": "runtime",
  "diagnostics:report:started": "diagnostics",
  "diagnostics:report:completed": "diagnostics",
  "diagnostics:report:failed": "diagnostics",
  "security:action:allowed": "security",
  "security:action:blocked": "security",
  "security:action:confirmation_requested": "security",
  "security:action:confirmed": "security",
  "security:action:cancelled": "security",
  "auth:operator:handoff_started": "security",
  "auth:operator:handoff_completed": "security",
  "auth:operator:handoff_fallback": "security",
  "auth:operator:handoff_failed": "security",
  "audit:ingest:accepted": "internal",
  "audit:ingest:rejected": "internal",
  "audit:ingest:fallback": "internal",
  "audit:ingest:failed": "internal",
};
