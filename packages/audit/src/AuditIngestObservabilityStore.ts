import type { AuditIngestMetric } from "./AuditIngestMetric";
import type { AuditIngestOutcome } from "./AuditIngestOutcome";
import {
  EMPTY_AUDIT_INGEST_OBSERVABILITY_SNAPSHOT,
  type AuditIngestObservabilitySnapshot,
} from "./AuditIngestObservabilitySnapshot";

export type AuditIngestObservabilityListener = (
  snapshot: AuditIngestObservabilitySnapshot,
  metric: AuditIngestMetric,
) => void;

export class AuditIngestObservabilityStore {
  private snapshot: AuditIngestObservabilitySnapshot = {
    ...EMPTY_AUDIT_INGEST_OBSERVABILITY_SNAPSHOT,
  };

  private readonly listeners = new Set<AuditIngestObservabilityListener>();

  getSnapshot(): AuditIngestObservabilitySnapshot {
    return { ...this.snapshot };
  }

  subscribe(listener: AuditIngestObservabilityListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  record(metric: AuditIngestMetric): AuditIngestObservabilitySnapshot {
    this.snapshot = {
      ...this.snapshot,
      totalAttempts: this.snapshot.totalAttempts + 1,
      accepted: this.snapshot.accepted + (metric.outcome === "accepted" ? 1 : 0),
      rejected: this.snapshot.rejected + (metric.outcome === "rejected" ? 1 : 0),
      failed: this.snapshot.failed + (metric.outcome === "failed" ? 1 : 0),
      fallback:
        this.snapshot.fallback +
        (metric.outcome === "fallback" || metric.usedFallback ? 1 : 0),
      lastOutcome: metric.outcome,
      lastRemoteStatus: metric.remoteStatus ?? null,
      lastErrorCode: metric.errorCode ?? null,
      lastLatencyMs: metric.latencyMs ?? null,
      lastAttemptAt: metric.recordedAt,
      lastError: metric.errorMessage ?? null,
    };

    const next = this.getSnapshot();
    this.listeners.forEach((listener) => listener(next, metric));
    return next;
  }

  /** Registro explícito de fallback (ex.: apenas localStorage). */
  recordFallbackOnly(metric: Omit<AuditIngestMetric, "outcome">): AuditIngestObservabilitySnapshot {
    return this.record({ ...metric, outcome: "fallback", usedFallback: true });
  }

  reset(): void {
    this.snapshot = { ...EMPTY_AUDIT_INGEST_OBSERVABILITY_SNAPSHOT };
  }
}

let sharedStore: AuditIngestObservabilityStore | null = null;

export function getAuditIngestObservabilityStore(): AuditIngestObservabilityStore {
  if (!sharedStore) {
    sharedStore = new AuditIngestObservabilityStore();
  }
  return sharedStore;
}

export function createAuditIngestObservabilityStore(): AuditIngestObservabilityStore {
  return new AuditIngestObservabilityStore();
}

export function resolveOverallIngestObservabilityStatus(
  snapshot: AuditIngestObservabilitySnapshot,
): AuditIngestOutcome | "idle" {
  if (snapshot.totalAttempts === 0) {
    return "idle";
  }
  return snapshot.lastOutcome ?? "idle";
}
