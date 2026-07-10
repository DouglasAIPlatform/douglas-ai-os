import type { SupabaseAuditAppendResult } from "./SupabaseAuditResults";
import type { AuditIngestMetric } from "./AuditIngestMetric";
import type { AuditIngestOutcome } from "./AuditIngestOutcome";
import { sanitizeAuditErrorForDisplay } from "./AuditIngestResponse";
import type { AuditIngestTelemetryEventPayload } from "./AuditIngestTelemetryPolicy";

export function resolveIngestOutcomeFromAppendResult(
  result: SupabaseAuditAppendResult,
): AuditIngestOutcome {
  if (result.success) {
    return "accepted";
  }

  if (result.remoteStatus === "rejected") {
    return "rejected";
  }

  return "failed";
}

export function buildAuditIngestMetric(
  result: SupabaseAuditAppendResult,
  options: {
    usedFallback: boolean;
    latencyMs?: number;
    auditId?: string;
    requestId?: string;
    correlationId?: string;
  },
): AuditIngestMetric {
  const outcome = resolveIngestOutcomeFromAppendResult(result);

  return {
    outcome,
    usedFallback: options.usedFallback,
    recordedAt: new Date().toISOString(),
    auditId: options.auditId ?? result.auditId,
    requestId: options.requestId ?? result.requestId,
    correlationId: options.correlationId ?? result.correlationId,
    remoteStatus: result.remoteStatus,
    errorCode: result.errorCode,
    latencyMs: options.latencyMs ?? result.latencyMs,
    errorMessage: result.success
      ? null
      : sanitizeAuditErrorForDisplay(result.error ?? null),
  };
}

export function metricToTelemetryPayload(
  metric: AuditIngestMetric,
): AuditIngestTelemetryEventPayload {
  return {
    outcome: metric.outcome,
    auditId: metric.auditId,
    requestId: metric.requestId,
    correlationId: metric.correlationId,
    errorCode: metric.errorCode,
    latencyMs: metric.latencyMs,
    remoteStatus: metric.remoteStatus,
  };
}
