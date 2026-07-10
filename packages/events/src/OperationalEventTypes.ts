/**
 * Tipos compartilhados da camada operacional — contrato canônico do Event Bus.
 * Consumidores: @douglas/security, @douglas/audit, Event Monitor (Headquarters).
 */
export type OperatorRole = "owner" | "admin" | "operator" | "viewer";

export type SecuredActionType =
  | "refresh_module"
  | "run_health_check"
  | "pause_module"
  | "resume_module"
  | "restart_module";

/** Ações publicadas nos tópicos runtime:action:* */
export type RuntimeActionType = SecuredActionType;

export type ActionConfirmationRiskLevel = "low" | "medium" | "high";

export type ReadinessStatus = "ready" | "degraded" | "not_ready";

/**
 * Payload mínimo dos tópicos security:action:*.
 * Campos opcionais de correlação preenchidos conforme o estágio do fluxo.
 */
export interface SecurityActionEventPayload {
  /** ID da entrada em ActionAuditLog (@douglas/security). */
  auditId?: string;
  /** ID da solicitação de confirmação (ActionConfirmationRequest.id). */
  requestId?: string;
  /** ID de correlação do fluxo — tipicamente igual ao requestId. */
  correlationId?: string;
  operatorId: string;
  operatorName?: string;
  operatorRole: OperatorRole;
  moduleId: string;
  action: SecuredActionType;
  message?: string;
  /** Presente em security:action:confirmation_requested. */
  risk?: ActionConfirmationRiskLevel;
}

/** Tópicos security:action:* publicados pelo SecurityLayer. */
export const SECURITY_ACTION_EVENT_TOPICS = [
  "security:action:allowed",
  "security:action:blocked",
  "security:action:confirmation_requested",
  "security:action:confirmed",
  "security:action:cancelled",
] as const;

export type SecurityActionEventTopic = (typeof SECURITY_ACTION_EVENT_TOPICS)[number];

/** Tópicos runtime:action:* publicados pelo RuntimeControlService. */
export const RUNTIME_ACTION_EVENT_TOPICS = [
  "runtime:action:started",
  "runtime:action:completed",
  "runtime:action:failed",
] as const;

export type RuntimeActionEventTopic = (typeof RUNTIME_ACTION_EVENT_TOPICS)[number];

/** Tópicos diagnostics:report:* publicados pelo BootDiagnostics. */
export const DIAGNOSTICS_REPORT_EVENT_TOPICS = [
  "diagnostics:report:started",
  "diagnostics:report:completed",
  "diagnostics:report:failed",
] as const;

export type DiagnosticsReportEventTopic = (typeof DIAGNOSTICS_REPORT_EVENT_TOPICS)[number];

/** Auth → operator handoff lifecycle (Sprint 5.26, evoluído 5.43). */
export type AuthOperatorHandoffState =
  | "mock_operator"
  | "not_configured"
  | "profile_error"
  | "profile_missing"
  | "authenticated_with_active_profile"
  | "authenticated_with_inactive_profile"
  | "blocked_by_profile_status"
  | "authenticated_with_profile"
  | "authenticated_without_profile";

export type AuthOperatorRoleSource = "mock" | "auth_profile" | "fallback" | "blocked";

export interface AuthOperatorHandoffEventPayload {
  handoffState: AuthOperatorHandoffState;
  operatorSource: AuthOperatorRoleSource;
  userId?: string;
  operatorId?: string;
  operatorRole?: OperatorRole;
  message?: string;
}

/** Tópicos auth:operator:handoff_* publicados pelo AuthOperatorBridge. */
export const AUTH_OPERATOR_HANDOFF_EVENT_TOPICS = [
  "auth:operator:handoff_started",
  "auth:operator:handoff_completed",
  "auth:operator:handoff_fallback",
  "auth:operator:handoff_failed",
] as const;

export type AuthOperatorHandoffEventTopic = (typeof AUTH_OPERATOR_HANDOFF_EVENT_TOPICS)[number];

/** Padrão de naming: `<domínio>:<recurso>:<verbo>` */
export const OPERATIONAL_EVENT_TOPIC_PATTERN = "<domain>:<resource>:<verb>";
