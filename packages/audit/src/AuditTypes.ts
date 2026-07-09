export type AuditSeverity = "info" | "warning" | "error" | "critical";

export type AuditSource = "security" | "runtime" | "diagnostics" | "platform" | "authentication";

export type AuditAction =
  | "action_allowed"
  | "action_blocked"
  | "action_confirmed"
  | "action_cancelled"
  | "action_confirmation_requested"
  | "auth_handoff_started"
  | "auth_handoff_completed"
  | "auth_handoff_fallback"
  | "auth_handoff_failed"
  | "runtime_action_started"
  | "runtime_action_completed"
  | "runtime_action_failed"
  | "diagnostics_critical_issue"
  | "readiness_status_changed";

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  source: AuditSource;
  action: AuditAction;
  target: string;
  severity: AuditSeverity;
  message: string;
  metadata: Record<string, unknown>;
}

/** Contrato para persistência futura (Supabase, arquivo, etc.). */
export interface AuditPersistenceAdapter {
  append(entry: AuditEntry): Promise<void> | void;
  query?(limit?: number): Promise<AuditEntry[]> | AuditEntry[];
}

export const AUDIT_SEVERITY_LABELS: Record<AuditSeverity, string> = {
  info: "Info",
  warning: "Aviso",
  error: "Erro",
  critical: "Crítico",
};

export const AUDIT_SOURCE_LABELS: Record<AuditSource, string> = {
  security: "Segurança",
  runtime: "Runtime",
  diagnostics: "Diagnostics",
  platform: "Plataforma",
  authentication: "Autenticação",
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  action_allowed: "Ação permitida",
  action_blocked: "Ação bloqueada",
  action_confirmed: "Ação confirmada",
  action_cancelled: "Ação cancelada",
  action_confirmation_requested: "Confirmação solicitada",
  auth_handoff_started: "Handoff auth iniciado",
  auth_handoff_completed: "Handoff auth concluído",
  auth_handoff_fallback: "Handoff auth fallback mock",
  auth_handoff_failed: "Handoff auth falhou",
  runtime_action_started: "Runtime iniciado",
  runtime_action_completed: "Runtime concluído",
  runtime_action_failed: "Runtime falhou",
  diagnostics_critical_issue: "Issue crítico (diagnostics)",
  readiness_status_changed: "Readiness alterado",
};

export const AUDITED_EVENT_TOPICS = [
  "security:action:allowed",
  "security:action:blocked",
  "security:action:confirmation_requested",
  "security:action:confirmed",
  "security:action:cancelled",
  "auth:operator:handoff_started",
  "auth:operator:handoff_completed",
  "auth:operator:handoff_fallback",
  "auth:operator:handoff_failed",
  "runtime:action:started",
  "runtime:action:completed",
  "runtime:action:failed",
  "diagnostics:report:completed",
  "diagnostics:report:failed",
] as const;
