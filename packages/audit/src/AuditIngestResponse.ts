/** Status remoto padronizado da Edge Function audit-ingest (Sprint 5.27). */
export type AuditIngestResponseStatus = "accepted" | "rejected" | "error";

export type AuditIngestErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "INVALID_JSON"
  | "VALIDATION_FAILED"
  | "JWT_REQUIRED"
  | "JWT_INVALID"
  | "CONFIG_ERROR"
  | "INSERT_FAILED"
  | "FUNCTION_ERROR"
  | "FUNCTION_NOT_DEPLOYED";

export interface AuditIngestResponse {
  success: boolean;
  status: AuditIngestResponseStatus;
  message: string;
  auditId?: string;
  requestId?: string;
  correlationId?: string;
  errorCode?: AuditIngestErrorCode;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parses Edge Function body — supports Sprint 5.27 format and legacy `{ ok }` responses. */
export function parseAuditIngestResponse(data: unknown): AuditIngestResponse | null {
  if (!isRecord(data)) {
    return null;
  }

  if ("success" in data && typeof data.success === "boolean" && "status" in data) {
    const status = data.status;
    if (status !== "accepted" && status !== "rejected" && status !== "error") {
      return null;
    }

    return {
      success: data.success,
      status,
      message: isNonEmptyString(data.message) ? data.message : data.success ? "OK" : "Erro",
      auditId: isNonEmptyString(data.auditId) ? data.auditId : undefined,
      requestId: isNonEmptyString(data.requestId) ? data.requestId : undefined,
      correlationId: isNonEmptyString(data.correlationId) ? data.correlationId : undefined,
      errorCode:
        isNonEmptyString(data.errorCode) ? (data.errorCode as AuditIngestErrorCode) : undefined,
    };
  }

  if ("ok" in data && typeof data.ok === "boolean") {
    const legacyError = isNonEmptyString(data.error) ? data.error : undefined;
    return {
      success: data.ok,
      status: data.ok ? "accepted" : "rejected",
      message: legacyError ?? (data.ok ? "Audit entry inserted" : "Edge Function rejected payload"),
      auditId: isNonEmptyString(data.auditId) ? data.auditId : undefined,
      errorCode: data.ok ? undefined : "VALIDATION_FAILED",
    };
  }

  return null;
}

/** Removes sensitive fragments before showing errors in UI. */
export function sanitizeAuditErrorForDisplay(error: string | null | undefined): string | null {
  if (!error) {
    return null;
  }

  return error
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/\bservice[_-]?role\b/gi, "[redacted]")
    .replace(/\bsb_[a-z]+_[A-Za-z0-9+/=]+\b/g, "[redacted]")
    .trim()
    .slice(0, 240);
}

export const AUDIT_INGEST_RESPONSE_STATUS_LABELS: Record<AuditIngestResponseStatus, string> = {
  accepted: "Aceito",
  rejected: "Rejeitado",
  error: "Erro",
};

export const AUDIT_INGEST_ERROR_CODE_LABELS: Partial<Record<AuditIngestErrorCode, string>> = {
  METHOD_NOT_ALLOWED: "Método HTTP inválido",
  INVALID_JSON: "JSON inválido",
  VALIDATION_FAILED: "Payload inválido",
  JWT_REQUIRED: "JWT obrigatório",
  JWT_INVALID: "JWT inválido",
  CONFIG_ERROR: "Configuração da função",
  INSERT_FAILED: "Falha no insert",
  FUNCTION_ERROR: "Erro na invocação",
  FUNCTION_NOT_DEPLOYED: "Função não deployada",
};
