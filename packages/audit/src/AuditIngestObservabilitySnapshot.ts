import type { AuditIngestOutcome } from "./AuditIngestOutcome";

/** Agregado de métricas da sessão atual (browser). */
export interface AuditIngestObservabilitySnapshot {
  totalAttempts: number;
  accepted: number;
  rejected: number;
  fallback: number;
  failed: number;
  lastOutcome: AuditIngestOutcome | null;
  lastRemoteStatus: "accepted" | "rejected" | "error" | null;
  lastErrorCode: string | null;
  lastLatencyMs: number | null;
  lastAttemptAt: string | null;
  /** Erro sanitizado — sem secrets/PII. */
  lastError: string | null;
}

export const EMPTY_AUDIT_INGEST_OBSERVABILITY_SNAPSHOT: AuditIngestObservabilitySnapshot =
  {
    totalAttempts: 0,
    accepted: 0,
    rejected: 0,
    fallback: 0,
    failed: 0,
    lastOutcome: null,
    lastRemoteStatus: null,
    lastErrorCode: null,
    lastLatencyMs: null,
    lastAttemptAt: null,
    lastError: null,
  };

/** Taxa de falha (rejected + failed) / total — null se amostra insuficiente. */
export function computeAuditIngestFailureRate(
  snapshot: AuditIngestObservabilitySnapshot,
  minAttempts = 3,
): number | null {
  if (snapshot.totalAttempts < minAttempts) {
    return null;
  }
  return (snapshot.rejected + snapshot.failed) / snapshot.totalAttempts;
}

export function hasObservedAuditIngestAccepted(
  snapshot: AuditIngestObservabilitySnapshot,
): boolean {
  return snapshot.accepted > 0;
}
