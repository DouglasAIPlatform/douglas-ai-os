/**
 * Douglas AI Platform — audit-ingest Edge Function
 * Sprint 5.27 (foundation) + 5.33 (hardening) + 5.35 (role authorization)
 *
 * Alinhado com:
 * - packages/audit/src/AuditIngestPayload.ts
 * - packages/audit/src/AuditIngestResponse.ts
 * - packages/audit/src/SupabaseAuditRowMapper.ts
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import type { AuditActorResolution } from "./AuditActorResolution.ts";
import type { AuditAuthErrorCode } from "./AuditAuthorizationResult.ts";
import { authorizeAuditIngest } from "./authorizeAuditIngest.ts";
import { resolveAuditIngestAuthMode } from "./AuditAuthMode.ts";
import { emitAuditIngestStructuredLog } from "./auditIngestStructuredLog.ts";

const TABLE_NAME = "operational_audit_entries";
const DEFAULT_MAX_METADATA_BYTES = 8192;

const AUDIT_SOURCES = new Set([
  "security",
  "runtime",
  "diagnostics",
  "platform",
  "authentication",
]);

const AUDIT_SEVERITIES = new Set(["info", "warning", "error", "critical"]);

const AUDIT_ACTIONS = new Set([
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
]);

const OPTIONAL_METADATA_STRING_KEYS = [
  "correlationId",
  "correlation_id",
  "requestId",
  "request_id",
  "auditId",
  "audit_id",
] as const;

type IngestStatus = "accepted" | "rejected" | "error";

/** Códigos estáveis — Sprint 5.33 + 5.35 */
type IngestErrorCode =
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
  | "internal_error";

interface AuditIngestPayload {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  source: string;
  action: string;
  target: string;
  severity: string;
  message: string;
  metadata: Record<string, unknown>;
}

interface AuditIngestResponseBody {
  success: boolean;
  status: IngestStatus;
  message: string;
  auditId?: string;
  requestId?: string;
  correlationId?: string;
  errorCode?: IngestErrorCode;
}

interface CorrelationIds {
  auditId?: string;
  requestId?: string;
  correlationId?: string;
}

function parseMaxMetadataBytes(): number {
  const raw = Deno.env.get("AUDIT_INGEST_MAX_METADATA_BYTES");
  if (!raw) return DEFAULT_MAX_METADATA_BYTES;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_METADATA_BYTES;
}

function parseCorsAllowlist(): string[] {
  const raw = Deno.env.get("AUDIT_INGEST_CORS_ORIGIN");
  if (!raw || raw.trim() === "" || raw.trim() === "*") {
    return ["*"];
  }
  return raw.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function isOriginAllowed(req: Request): boolean {
  const allowlist = parseCorsAllowlist();
  if (allowlist.includes("*")) {
    return true;
  }

  const origin = req.headers.get("Origin");
  if (!origin) {
    return true;
  }

  return allowlist.includes(origin);
}

function buildCorsHeaders(req: Request): Record<string, string> | null {
  if (!isOriginAllowed(req)) {
    return null;
  }

  const allowlist = parseCorsAllowlist();
  const origin = req.headers.get("Origin");
  const allowedOrigin = allowlist.includes("*")
    ? (origin ?? "*")
    : (origin ?? allowlist[0] ?? "*");

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function jsonResponse(
  req: Request,
  body: AuditIngestResponseBody,
  status = 200,
): Response {
  const corsHeaders = buildCorsHeaders(req);
  if (!corsHeaders) {
    return new Response(
      JSON.stringify({
        success: false,
        status: "rejected",
        message: "Origin não permitido",
        errorCode: "cors_rejected",
      } satisfies AuditIngestResponseBody),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readCorrelationId(metadata: Record<string, unknown>): string | null {
  const value = metadata.correlationId ?? metadata.correlation_id;
  return isNonEmptyString(value) ? value : null;
}

function readRequestId(metadata: Record<string, unknown>): string | null {
  const value = metadata.requestId ?? metadata.request_id;
  return isNonEmptyString(value) ? value : null;
}

function readAuditId(metadata: Record<string, unknown>, fallbackId: string): string {
  const value = metadata.auditId ?? metadata.audit_id;
  return isNonEmptyString(value) ? value : fallbackId;
}

function extractCorrelationIds(body: unknown): CorrelationIds {
  if (!isRecord(body)) {
    return {};
  }

  const metadata = isRecord(body.metadata) ? body.metadata : {};
  const auditId = isNonEmptyString(body.id)
    ? body.id
    : readAuditId(metadata, "") || undefined;

  return {
    auditId,
    requestId: readRequestId(metadata) ?? undefined,
    correlationId: readCorrelationId(metadata) ?? undefined,
  };
}

function validateOptionalMetadataFields(metadata: Record<string, unknown>): string | null {
  for (const key of OPTIONAL_METADATA_STRING_KEYS) {
    if (!(key in metadata)) continue;
    const value = metadata[key];
    if (value === null || value === undefined) continue;
    if (!isNonEmptyString(value)) {
      return `metadata.${key} inválido`;
    }
  }
  return null;
}

function validateMetadataSize(metadata: Record<string, unknown>): string | null {
  try {
    const size = new TextEncoder().encode(JSON.stringify(metadata)).byteLength;
    if (size > parseMaxMetadataBytes()) {
      return "metadata excede o limite permitido";
    }
  } catch {
    return "metadata inválido";
  }
  return null;
}

function validatePayload(body: unknown):
  | { valid: true; payload: AuditIngestPayload }
  | { valid: false; error: string } {
  if (!isRecord(body)) {
    return { valid: false, error: "Payload deve ser um objeto JSON" };
  }

  if (!isNonEmptyString(body.id)) return { valid: false, error: "Campo id é obrigatório" };
  if (!isNonEmptyString(body.timestamp)) {
    return { valid: false, error: "Campo timestamp é obrigatório" };
  }
  if (!isNonEmptyString(body.actor)) return { valid: false, error: "Campo actor é obrigatório" };
  if (!isNonEmptyString(body.role)) return { valid: false, error: "Campo role é obrigatório" };

  if (!isNonEmptyString(body.source) || !AUDIT_SOURCES.has(body.source)) {
    return { valid: false, error: "Campo source é obrigatório e inválido" };
  }

  if (!isNonEmptyString(body.action) || !AUDIT_ACTIONS.has(body.action)) {
    return { valid: false, error: "Campo action é obrigatório e inválido" };
  }

  if (typeof body.target !== "string") {
    return { valid: false, error: "Campo target deve ser string" };
  }

  if (!isNonEmptyString(body.severity) || !AUDIT_SEVERITIES.has(body.severity)) {
    return { valid: false, error: "Campo severity é obrigatório e inválido" };
  }

  if (!isNonEmptyString(body.message)) {
    return { valid: false, error: "Campo message é obrigatório" };
  }

  if (body.metadata !== undefined && body.metadata !== null && !isRecord(body.metadata)) {
    return { valid: false, error: "Campo metadata deve ser objeto quando presente" };
  }

  const metadata = isRecord(body.metadata) ? body.metadata : {};
  const optionalError = validateOptionalMetadataFields(metadata);
  if (optionalError) {
    return { valid: false, error: optionalError };
  }

  const metadataSizeError = validateMetadataSize(metadata);
  if (metadataSizeError) {
    return { valid: false, error: metadataSizeError };
  }

  return {
    valid: true,
    payload: {
      id: body.id,
      timestamp: body.timestamp,
      actor: body.actor,
      role: body.role,
      source: body.source,
      action: body.action,
      target: body.target,
      severity: body.severity,
      message: body.message,
      metadata,
    },
  };
}

function mapToRow(
  entry: AuditIngestPayload,
  actor: AuditActorResolution,
  actorSource: "server_profile" | "payload",
) {
  const metadata = {
    ...entry.metadata,
    operatorId: actor.actorId,
    ...(actorSource === "server_profile"
      ? { operatorRoleSource: "server_profile" as const }
      : {}),
  };

  return {
    timestamp: entry.timestamp,
    actor_id: actor.actorId,
    actor_name: actor.actorName,
    actor_role: actor.actorRole,
    source: entry.source,
    action: entry.action,
    target: entry.target,
    severity: entry.severity,
    message: entry.message,
    correlation_id: readCorrelationId(entry.metadata),
    request_id: readRequestId(entry.metadata),
    audit_id: readAuditId(entry.metadata, entry.id),
    metadata,
  };
}

function toIngestErrorCode(code: AuditAuthErrorCode): IngestErrorCode {
  return code;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    const corsHeaders = buildCorsHeaders(req);
    if (!corsHeaders) {
      return jsonResponse(
        req,
        {
          success: false,
          status: "rejected",
          message: "Origin não permitido",
          errorCode: "cors_rejected",
        },
        403,
      );
    }
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      req,
      {
        success: false,
        status: "rejected",
        message: "Método não permitido — use POST",
        errorCode: "method_not_allowed",
      },
      405,
    );
  }

  const requestStartedAt = performance.now();
  const authMode = resolveAuditIngestAuthMode();

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    emitAuditIngestStructuredLog({
      status: "error",
      latencyMs: Math.round(performance.now() - requestStartedAt),
      authMode,
      errorCode: "internal_error",
    });
    return jsonResponse(
      req,
      {
        success: false,
        status: "error",
        message: "Função indisponível — configuração incompleta",
        errorCode: "internal_error",
      },
      500,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    emitAuditIngestStructuredLog({
      status: "rejected",
      latencyMs: Math.round(performance.now() - requestStartedAt),
      authMode,
      errorCode: "invalid_payload",
    });
    return jsonResponse(
      req,
      {
        success: false,
        status: "rejected",
        message: "Payload JSON inválido",
        errorCode: "invalid_payload",
      },
      400,
    );
  }

  const correlationIds = extractCorrelationIds(body);
  const validation = validatePayload(body);
  if (!validation.valid) {
    emitAuditIngestStructuredLog({
      status: "rejected",
      latencyMs: Math.round(performance.now() - requestStartedAt),
      authMode,
      auditId: correlationIds.auditId,
      requestId: correlationIds.requestId,
      correlationId: correlationIds.correlationId,
      errorCode: "invalid_payload",
    });
    return jsonResponse(
      req,
      {
        success: false,
        status: "rejected",
        message: validation.error,
        auditId: correlationIds.auditId,
        requestId: correlationIds.requestId,
        correlationId: correlationIds.correlationId,
        errorCode: "invalid_payload",
      },
      400,
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const payload = validation.payload;

  const authorization = await authorizeAuditIngest({
    req,
    supabaseUrl,
    adminClient,
    payload,
  });

  if (authorization.kind === "failure") {
    emitAuditIngestStructuredLog({
      status: "rejected",
      latencyMs: Math.round(performance.now() - requestStartedAt),
      authMode,
      auditId: payload.id,
      requestId: readRequestId(payload.metadata) ?? undefined,
      correlationId: readCorrelationId(payload.metadata) ?? undefined,
      errorCode: toIngestErrorCode(authorization.errorCode),
    });
    return jsonResponse(
      req,
      {
        success: false,
        status: "rejected",
        message: authorization.message,
        auditId: payload.id,
        requestId: readRequestId(payload.metadata) ?? undefined,
        correlationId: readCorrelationId(payload.metadata) ?? undefined,
        errorCode: toIngestErrorCode(authorization.errorCode),
      },
      authorization.httpStatus,
    );
  }

  const row = mapToRow(
    payload,
    authorization.actor,
    authorization.kind === "authenticated" ? "server_profile" : "payload",
  );
  const { error } = await adminClient.from(TABLE_NAME).insert(row);

  if (error) {
    console.error("audit-ingest insert_failed", error.code ?? "unknown");
    emitAuditIngestStructuredLog({
      status: "error",
      latencyMs: Math.round(performance.now() - requestStartedAt),
      authMode,
      auditId: payload.id,
      requestId: readRequestId(payload.metadata) ?? undefined,
      correlationId: readCorrelationId(payload.metadata) ?? undefined,
      errorCode: "insert_failed",
      authorizedRole:
        authorization.kind === "authenticated" ? authorization.operator.role : undefined,
    });
    return jsonResponse(
      req,
      {
        success: false,
        status: "error",
        message: "Falha ao persistir entrada de audit",
        auditId: payload.id,
        requestId: readRequestId(payload.metadata) ?? undefined,
        correlationId: readCorrelationId(payload.metadata) ?? undefined,
        errorCode: "insert_failed",
      },
      500,
    );
  }

  emitAuditIngestStructuredLog({
    status: "accepted",
    latencyMs: Math.round(performance.now() - requestStartedAt),
    authMode,
    auditId: payload.id,
    requestId: readRequestId(payload.metadata) ?? undefined,
    correlationId: readCorrelationId(payload.metadata) ?? undefined,
    authorizedRole:
      authorization.kind === "authenticated" ? authorization.operator.role : undefined,
  });

  return jsonResponse(req, {
    success: true,
    status: "accepted",
    message: "Audit entry accepted",
    auditId: payload.id,
    requestId: readRequestId(payload.metadata) ?? undefined,
    correlationId: readCorrelationId(payload.metadata) ?? undefined,
  });
});
