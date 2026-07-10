import type { AuditPendingEntry } from "./AuditPendingEntry";
import type { AuditPendingCleanupPolicy } from "./AuditPendingCleanupPolicy";
import {
  DEFAULT_AUDIT_PENDING_CLEANUP_POLICY,
  type AuditPendingCleanupOperation,
} from "./AuditPendingCleanupPolicy";
import type { AuditPendingCleanupResult } from "./AuditPendingCleanupResult";
import { EMPTY_AUDIT_PENDING_CLEANUP_RESULT } from "./AuditPendingCleanupResult";
import type { AuditPendingQueue } from "./AuditPendingQueue";
import type { AuditPendingQueueStats } from "./AuditPendingQueueStats";
import { EMPTY_AUDIT_PENDING_QUEUE_STATS } from "./AuditPendingQueueStats";

export interface AuditPendingQueueCleanupState {
  lastCleanupAt: string | null;
  lastCleanupResult: AuditPendingCleanupResult | null;
}

function matchesLegacyError(error: string | null, patterns: string[]): boolean {
  if (!error) return false;
  const normalized = error.toLowerCase();
  return patterns.some((pattern) => normalized.includes(pattern.toLowerCase()));
}

export function isLegacyResolvedPendingEntry(
  entry: AuditPendingEntry,
  policy: AuditPendingCleanupPolicy = DEFAULT_AUDIT_PENDING_CLEANUP_POLICY,
): boolean {
  return matchesLegacyError(entry.lastError, policy.legacyErrorPatterns);
}

export function isFailedPendingEntry(
  entry: AuditPendingEntry,
  policy: AuditPendingCleanupPolicy = DEFAULT_AUDIT_PENDING_CLEANUP_POLICY,
): boolean {
  if (isLegacyResolvedPendingEntry(entry, policy)) {
    return true;
  }
  return entry.attemptCount >= policy.minAttemptsForFailed && entry.lastError !== null;
}

export function isStalePendingEntry(
  entry: AuditPendingEntry,
  policy: AuditPendingCleanupPolicy = DEFAULT_AUDIT_PENDING_CLEANUP_POLICY,
  now = Date.now(),
): boolean {
  const enqueuedAt = new Date(entry.enqueuedAt).getTime();
  if (Number.isNaN(enqueuedAt)) {
    return false;
  }
  return now - enqueuedAt >= policy.staleAfterMs;
}

export function computeAuditPendingQueueStats(
  entries: AuditPendingEntry[],
  policy: AuditPendingCleanupPolicy = DEFAULT_AUDIT_PENDING_CLEANUP_POLICY,
  now = Date.now(),
): AuditPendingQueueStats {
  if (entries.length === 0) {
    return { ...EMPTY_AUDIT_PENDING_QUEUE_STATS };
  }

  let unattempted = 0;
  let failed = 0;
  let resolvedLegacy = 0;
  let staleFailed = 0;

  for (const entry of entries) {
    const legacy = isLegacyResolvedPendingEntry(entry, policy);
    const failedEntry = isFailedPendingEntry(entry, policy);
    const stale = isStalePendingEntry(entry, policy, now);

    if (legacy) {
      resolvedLegacy += 1;
    }

    if (failedEntry) {
      failed += 1;
    } else if (entry.attemptCount === 0) {
      unattempted += 1;
    }

    if (failedEntry && stale) {
      staleFailed += 1;
    }
  }

  return {
    total: entries.length,
    unattempted,
    failed,
    resolvedLegacy,
    staleFailed,
  };
}

/** Limpeza segura — afeta apenas a pending queue local (`douglas-ai-os:audit-pending-queue`). */
export class AuditPendingQueueCleanup {
  private readonly queue: AuditPendingQueue;
  private readonly policy: AuditPendingCleanupPolicy;
  private lastCleanupAt: string | null = null;
  private lastCleanupResult: AuditPendingCleanupResult | null = null;

  constructor(
    queue: AuditPendingQueue,
    policy: Partial<AuditPendingCleanupPolicy> = {},
  ) {
    this.queue = queue;
    this.policy = {
      ...DEFAULT_AUDIT_PENDING_CLEANUP_POLICY,
      ...policy,
    };
  }

  getState(): AuditPendingQueueCleanupState {
    return {
      lastCleanupAt: this.lastCleanupAt,
      lastCleanupResult: this.lastCleanupResult,
    };
  }

  getStats(now = Date.now()): AuditPendingQueueStats {
    return computeAuditPendingQueueStats(this.queue.list(), this.policy, now);
  }

  clearResolved(): AuditPendingCleanupResult {
    return this.runCleanup("clear_resolved", (entry) =>
      isLegacyResolvedPendingEntry(entry, this.policy),
    );
  }

  clearStaleFailed(now = Date.now()): AuditPendingCleanupResult {
    return this.runCleanup(
      "clear_stale_failed",
      (entry) =>
        isFailedPendingEntry(entry, this.policy) &&
        isStalePendingEntry(entry, this.policy, now),
    );
  }

  private runCleanup(
    operation: AuditPendingCleanupOperation,
    shouldRemove: (entry: AuditPendingEntry) => boolean,
  ): AuditPendingCleanupResult {
    const entries = this.queue.list();
    const toRemove = entries.filter(shouldRemove);

    if (toRemove.length === 0) {
      const result: AuditPendingCleanupResult = {
        ...EMPTY_AUDIT_PENDING_CLEANUP_RESULT,
        operation,
        remaining: entries.length,
        completedAt: new Date().toISOString(),
        skipped: true,
        skipReason: "nothing_to_remove",
        message: "Nenhuma pendência elegível para esta limpeza.",
      };
      this.lastCleanupAt = result.completedAt;
      this.lastCleanupResult = result;
      return result;
    }

    for (const entry of toRemove) {
      this.queue.remove(entry.id);
    }

    const completedAt = new Date().toISOString();
    const result: AuditPendingCleanupResult = {
      operation,
      removed: toRemove.length,
      remaining: this.queue.count(),
      removedIds: toRemove.map((entry) => entry.id),
      completedAt,
      message:
        operation === "clear_resolved"
          ? "Pendências legadas (ex.: RLS/direct_client) removidas da fila local."
          : "Pendências antigas/falhadas removidas da fila local.",
    };

    this.lastCleanupAt = completedAt;
    this.lastCleanupResult = result;
    return result;
  }
}

export function createAuditPendingQueueCleanup(
  queue: AuditPendingQueue,
  policy?: Partial<AuditPendingCleanupPolicy>,
): AuditPendingQueueCleanup {
  return new AuditPendingQueueCleanup(queue, policy);
}
