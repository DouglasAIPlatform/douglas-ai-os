import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditIngestPayload } from "./AuditIngestPayload";
import { readCorrelationId, readRequestId } from "./AuditIngestPayload";
import {
  normalizeAuditIngestErrorCode,
  parseAuditIngestResponse,
  sanitizeAuditErrorForDisplay,
  type AuditIngestErrorCode,
} from "./AuditIngestResponse";
import type { SupabaseAuditAppendResult } from "./SupabaseAuditResults";

export interface InvokeAuditIngestOptions {
  client: SupabaseClient;
  functionName: string;
  payload: AuditIngestPayload;
}

function readInvokeTransportError(error: unknown, data: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  const parsed = parseAuditIngestResponse(data);
  if (parsed?.message) {
    return parsed.message;
  }

  if (data && typeof data === "object" && "error" in data) {
    const payloadError = (data as { error?: string }).error;
    if (typeof payloadError === "string") {
      return payloadError;
    }
  }

  return "Falha ao invocar Edge Function audit-ingest";
}

function isFunctionNotFoundError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("function not found") ||
    normalized.includes("404") ||
    normalized.includes("audit-ingest")
  );
}

function buildFailureResult(
  message: string,
  options: {
    edgeFunctionNotDeployed?: boolean;
    errorCode?: AuditIngestErrorCode;
    remoteStatus?: SupabaseAuditAppendResult["remoteStatus"];
    latencyMs?: number;
    auditId?: string;
    requestId?: string;
    correlationId?: string;
  } = {},
): SupabaseAuditAppendResult {
  return {
    success: false,
    error: sanitizeAuditErrorForDisplay(message) ?? message,
    edgeFunctionNotDeployed: options.edgeFunctionNotDeployed,
    errorCode: options.errorCode,
    remoteStatus: options.remoteStatus ?? "error",
    latencyMs: options.latencyMs,
    auditId: options.auditId,
    requestId: options.requestId,
    correlationId: options.correlationId,
  };
}

/**
 * Invoca a Edge Function audit-ingest via Supabase client (anon key + JWT quando presente).
 * service_role nunca é usado no browser — apenas dentro da Edge Function.
 */
export async function invokeAuditIngestEdgeFunction(
  options: InvokeAuditIngestOptions,
): Promise<SupabaseAuditAppendResult> {
  const { client, functionName, payload } = options;

  try {
    const startedAt = performance.now();
    const { data, error } = await client.functions.invoke(functionName, {
      body: payload,
    });
    const latencyMs = Math.round(performance.now() - startedAt);

    if (error) {
      const message = readInvokeTransportError(error, data);
      const notDeployed = isFunctionNotFoundError(message);
      return buildFailureResult(message, {
        edgeFunctionNotDeployed: notDeployed,
        errorCode: notDeployed ? "function_not_deployed" : "function_error",
        remoteStatus: "error",
        latencyMs,
      });
    }

    const parsed = parseAuditIngestResponse(data);
    if (!parsed) {
      return buildFailureResult("Resposta inválida da Edge Function audit-ingest", {
        errorCode: "function_error",
        remoteStatus: "error",
        latencyMs,
      });
    }

    if (!parsed.success) {
      return {
        success: false,
        error: sanitizeAuditErrorForDisplay(parsed.message) ?? parsed.message,
        remoteStatus: parsed.status,
        auditId: parsed.auditId,
        requestId: parsed.requestId ?? readRequestId(payload.metadata),
        correlationId: parsed.correlationId ?? readCorrelationId(payload.metadata),
        errorCode:
          normalizeAuditIngestErrorCode(parsed.errorCode) ?? "invalid_payload",
        latencyMs,
      };
    }

    return {
      success: true,
      remoteStatus: parsed.status,
      auditId: parsed.auditId ?? payload.id,
      requestId: parsed.requestId ?? readRequestId(payload.metadata),
      correlationId: parsed.correlationId ?? readCorrelationId(payload.metadata),
      latencyMs,
    };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Erro inesperado ao invocar audit-ingest";
    const notDeployed = isFunctionNotFoundError(message);
    return buildFailureResult(message, {
      edgeFunctionNotDeployed: notDeployed,
      errorCode: notDeployed ? "function_not_deployed" : "function_error",
      remoteStatus: "error",
    });
  }
}
