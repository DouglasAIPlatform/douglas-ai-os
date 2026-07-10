/** Status remoto padronizado da Edge Function audit-ingest. */
export type AuditIngestResponseStatus = "accepted" | "rejected" | "error";

/** Códigos estáveis Sprint 5.33 + 5.35 (snake_case). */
export type AuditIngestErrorCode =
  | "method_not_allowed"
  | "cors_rejected"
  | "missing_auth"
  | "invalid_token"
  | "profile_not_found"
  | "profile_inactive"
  | "role_not_allowed"
  | "actor_resolution_failed"
  | "invalid_payload"
  | "insert_failed"
  | "internal_error"
  | "function_error"
  | "function_not_deployed";

/** Alias legados Sprint 5.27 — normalizados em parse. */
const LEGACY_ERROR_CODE_ALIASES: Record<string, AuditIngestErrorCode> = {
  METHOD_NOT_ALLOWED: "method_not_allowed",
  INVALID_JSON: "invalid_payload",
  VALIDATION_FAILED: "invalid_payload",
  JWT_REQUIRED: "missing_auth",
  JWT_INVALID: "invalid_token",
  CONFIG_ERROR: "internal_error",
  INSERT_FAILED: "insert_failed",
  FUNCTION_ERROR: "function_error",
  FUNCTION_NOT_DEPLOYED: "function_not_deployed",
};

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

/** Normaliza códigos legados (SCREAMING_SNAKE) para snake_case Sprint 5.33. */
export function normalizeAuditIngestErrorCode(
  code: string | undefined,
): AuditIngestErrorCode | undefined {
  if (!code) {
    return undefined;
  }

  if (code in LEGACY_ERROR_CODE_ALIASES) {
    return LEGACY_ERROR_CODE_ALIASES[code];
  }

  const canonical: AuditIngestErrorCode[] = [
    "method_not_allowed",
    "cors_rejected",
    "missing_auth",
    "invalid_token",
    "profile_not_found",
    "profile_inactive",
    "role_not_allowed",
    "actor_resolution_failed",
    "invalid_payload",
    "insert_failed",
    "internal_error",
    "function_error",
    "function_not_deployed",
  ];

  if (canonical.includes(code as AuditIngestErrorCode)) {
    return code as AuditIngestErrorCode;
  }

  return "internal_error";
}

/** Parses Edge Function body — supports Sprint 5.27/5.33 format and legacy `{ ok }`. */
export function parseAuditIngestResponse(data: unknown): AuditIngestResponse | null {
  if (!isRecord(data)) {
    return null;
  }

  if ("success" in data && typeof data.success === "boolean" && "status" in data) {
    const status = data.status;
    if (status !== "accepted" && status !== "rejected" && status !== "error") {
      return null;
    }

    const rawCode = isNonEmptyString(data.errorCode) ? data.errorCode : undefined;

    return {
      success: data.success,
      status,
      message: isNonEmptyString(data.message) ? data.message : data.success ? "OK" : "Erro",
      auditId: isNonEmptyString(data.auditId) ? data.auditId : undefined,
      requestId: isNonEmptyString(data.requestId) ? data.requestId : undefined,
      correlationId: isNonEmptyString(data.correlationId) ? data.correlationId : undefined,
      errorCode: normalizeAuditIngestErrorCode(rawCode),
    };
  }

  if ("ok" in data && typeof data.ok === "boolean") {
    const legacyError = isNonEmptyString(data.error) ? data.error : undefined;
    return {
      success: data.ok,
      status: data.ok ? "accepted" : "rejected",
      message: legacyError ?? (data.ok ? "Audit entry inserted" : "Edge Function rejected payload"),
      auditId: isNonEmptyString(data.auditId) ? data.auditId : undefined,
      errorCode: data.ok ? undefined : "invalid_payload",
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
  method_not_allowed: "Método HTTP inválido",
  cors_rejected: "Origin não permitido (CORS)",
  missing_auth: "Autenticação obrigatória ou ausente",
  invalid_token: "Token inválido ou expirado",
  profile_not_found: "Perfil operacional não encontrado",
  profile_inactive: "Perfil operacional inativo",
  role_not_allowed: "Role não autorizada para ingest remoto",
  actor_resolution_failed: "Falha ao resolver identidade do ator",
  invalid_payload: "Payload inválido",
  insert_failed: "Falha ao persistir remotamente",
  internal_error: "Erro interno da função",
  function_error: "Erro na invocação",
  function_not_deployed: "Função não deployada",
};
