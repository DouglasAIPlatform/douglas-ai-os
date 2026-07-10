import type { AuditIngestAuthMode } from "./AuditAuthMode.ts";

export interface AuditIngestStructuredLogInput {
  status: "accepted" | "rejected" | "error";
  latencyMs: number;
  authMode: AuditIngestAuthMode;
  auditId?: string;
  requestId?: string;
  correlationId?: string;
  errorCode?: string;
  /** Role autorizada (ex.: admin) — nunca email/UID. */
  authorizedRole?: string;
}

/** Emite log JSON operacional — sem tokens, keys, payload ou PII. */
export function emitAuditIngestStructuredLog(input: AuditIngestStructuredLogInput): void {
  const payload: Record<string, unknown> = {
    event: "audit_ingest",
    timestamp: new Date().toISOString(),
    status: input.status,
    latencyMs: input.latencyMs,
    authMode: input.authMode,
  };

  if (input.auditId) payload.auditId = input.auditId;
  if (input.requestId) payload.requestId = input.requestId;
  if (input.correlationId) payload.correlationId = input.correlationId;
  if (input.errorCode) payload.errorCode = input.errorCode;
  if (input.authorizedRole) payload.authorizedRole = input.authorizedRole;

  console.log(JSON.stringify(payload));
}
