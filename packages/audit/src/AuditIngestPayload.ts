import type { AuditAction, AuditEntry, AuditSeverity, AuditSource } from "./AuditTypes";

/** Payload mínimo aceito pela Edge Function audit-ingest. */
export interface AuditIngestPayload {
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

export interface AuditIngestValidationResult {
  valid: true;
  payload: AuditIngestPayload;
}

export interface AuditIngestValidationError {
  valid: false;
  error: string;
  errorCode?: "VALIDATION_FAILED";
}

const AUDIT_SOURCES: AuditSource[] = [
  "security",
  "runtime",
  "diagnostics",
  "platform",
  "authentication",
];

const AUDIT_SEVERITIES: AuditSeverity[] = ["info", "warning", "error", "critical"];

const AUDIT_ACTIONS: AuditAction[] = [
  "action_allowed",
  "action_blocked",
  "action_confirmed",
  "action_cancelled",
  "action_confirmation_requested",
  "auth_handoff_started",
  "auth_handoff_completed",
  "auth_handoff_fallback",
  "auth_handoff_failed",
  "runtime_action_started",
  "runtime_action_completed",
  "runtime_action_failed",
  "diagnostics_critical_issue",
  "readiness_status_changed",
];

const OPTIONAL_METADATA_STRING_KEYS = [
  "correlationId",
  "correlation_id",
  "requestId",
  "request_id",
  "auditId",
  "audit_id",
] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateOptionalMetadataFields(metadata: Record<string, unknown>): string | null {
  for (const key of OPTIONAL_METADATA_STRING_KEYS) {
    if (!(key in metadata)) {
      continue;
    }

    const value = metadata[key];
    if (value === null || value === undefined) {
      continue;
    }

    if (!isNonEmptyString(value)) {
      return `Campo metadata.${key} deve ser string não vazia quando presente`;
    }
  }

  return null;
}

function readCorrelationId(metadata: Record<string, unknown>): string | undefined {
  const value = metadata.correlationId ?? metadata.correlation_id;
  return isNonEmptyString(value) ? value : undefined;
}

function readRequestId(metadata: Record<string, unknown>): string | undefined {
  const value = metadata.requestId ?? metadata.request_id;
  return isNonEmptyString(value) ? value : undefined;
}

function readAuditId(metadata: Record<string, unknown>, fallbackId: string): string {
  const value = metadata.auditId ?? metadata.audit_id;
  return isNonEmptyString(value) ? value : fallbackId;
}

/** Valida AuditEntry antes de enviar à Edge Function ou persistir. */
export function validateAuditEntryForIngest(
  entry: unknown,
): AuditIngestValidationResult | AuditIngestValidationError {
  if (!isRecord(entry)) {
    return {
      valid: false,
      error: "Payload deve ser um objeto AuditEntry",
      errorCode: "VALIDATION_FAILED",
    };
  }

  if (!isNonEmptyString(entry.id)) {
    return { valid: false, error: "Campo id é obrigatório", errorCode: "VALIDATION_FAILED" };
  }

  if (!isNonEmptyString(entry.timestamp)) {
    return {
      valid: false,
      error: "Campo timestamp é obrigatório",
      errorCode: "VALIDATION_FAILED",
    };
  }

  if (!isNonEmptyString(entry.actor)) {
    return { valid: false, error: "Campo actor é obrigatório", errorCode: "VALIDATION_FAILED" };
  }

  if (!isNonEmptyString(entry.role)) {
    return { valid: false, error: "Campo role é obrigatório", errorCode: "VALIDATION_FAILED" };
  }

  if (!isNonEmptyString(entry.source) || !AUDIT_SOURCES.includes(entry.source as AuditSource)) {
    return { valid: false, error: "Campo source inválido", errorCode: "VALIDATION_FAILED" };
  }

  if (!isNonEmptyString(entry.action) || !AUDIT_ACTIONS.includes(entry.action as AuditAction)) {
    return { valid: false, error: "Campo action inválido", errorCode: "VALIDATION_FAILED" };
  }

  if (typeof entry.target !== "string") {
    return {
      valid: false,
      error: "Campo target deve ser string",
      errorCode: "VALIDATION_FAILED",
    };
  }

  if (
    !isNonEmptyString(entry.severity) ||
    !AUDIT_SEVERITIES.includes(entry.severity as AuditSeverity)
  ) {
    return { valid: false, error: "Campo severity inválido", errorCode: "VALIDATION_FAILED" };
  }

  if (typeof entry.message !== "string") {
    return {
      valid: false,
      error: "Campo message deve ser string",
      errorCode: "VALIDATION_FAILED",
    };
  }

  if (entry.metadata !== undefined && entry.metadata !== null && !isRecord(entry.metadata)) {
    return {
      valid: false,
      error: "Campo metadata deve ser objeto quando presente",
      errorCode: "VALIDATION_FAILED",
    };
  }

  const metadata = isRecord(entry.metadata) ? entry.metadata : {};
  const optionalError = validateOptionalMetadataFields(metadata);
  if (optionalError) {
    return { valid: false, error: optionalError, errorCode: "VALIDATION_FAILED" };
  }

  return {
    valid: true,
    payload: {
      id: entry.id,
      timestamp: entry.timestamp,
      actor: entry.actor,
      role: entry.role,
      source: entry.source as AuditSource,
      action: entry.action as AuditAction,
      target: entry.target,
      severity: entry.severity as AuditSeverity,
      message: entry.message,
      metadata,
    },
  };
}

export function auditEntryToIngestPayload(entry: AuditEntry): AuditIngestValidationResult {
  return validateAuditEntryForIngest(entry) as AuditIngestValidationResult;
}

export {
  readAuditId,
  readCorrelationId,
  readRequestId,
};
