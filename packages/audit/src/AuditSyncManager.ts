import type { AuditPendingEntry } from "./AuditPendingEntry";
import type { AuditPendingQueue } from "./AuditPendingQueue";
import type { AuditRetryPolicy } from "./AuditRetryPolicy";
import { DEFAULT_AUDIT_RETRY_POLICY } from "./AuditRetryPolicy";
import type { AuditRetryStatus } from "./AuditRetryStatus";
import type { AuditSyncResult } from "./AuditSyncResult";
import { EMPTY_AUDIT_SYNC_RESULT } from "./AuditSyncResult";
import type { SupabaseAuditPersistenceAdapter } from "./SupabaseAuditPersistenceAdapter";

export interface AuditSyncManagerConfig {
  isSupabaseConfigured: boolean;
  policy: AuditRetryPolicy;
}

export interface AuditSyncManagerState {
  syncStatus: AuditRetryStatus;
  lastRetryAt: string | null;
  lastRetryError: string | null;
  lastSyncResult: AuditSyncResult | null;
}

export class AuditSyncManager {
  private readonly pendingQueue: AuditPendingQueue;
  private readonly supabaseAdapter: SupabaseAuditPersistenceAdapter | null;
  private readonly config: AuditSyncManagerConfig;
  private syncStatus: AuditRetryStatus = "idle";
  private lastRetryAt: string | null = null;
  private lastRetryError: string | null = null;
  private lastSyncResult: AuditSyncResult | null = null;
  private retryInFlight = false;

  constructor(
    pendingQueue: AuditPendingQueue,
    supabaseAdapter: SupabaseAuditPersistenceAdapter | null,
    config: Partial<AuditSyncManagerConfig> = {},
  ) {
    this.pendingQueue = pendingQueue;
    this.supabaseAdapter = supabaseAdapter;
    this.config = {
      isSupabaseConfigured: config.isSupabaseConfigured ?? false,
      policy: {
        ...DEFAULT_AUDIT_RETRY_POLICY,
        ...config.policy,
      },
    };
  }

  getState(): AuditSyncManagerState {
    return {
      syncStatus: this.resolveIdleSyncStatus(),
      lastRetryAt: this.lastRetryAt,
      lastRetryError: this.lastRetryError,
      lastSyncResult: this.lastSyncResult,
    };
  }

  private resolveIdleSyncStatus(): AuditRetryStatus {
    if (this.retryInFlight) {
      return "retrying";
    }

    const pendingCount = this.pendingQueue.count();
    if (pendingCount > 0) {
      return this.syncStatus === "failed" ? "failed" : "pending";
    }

    if (this.syncStatus === "synced") {
      return "synced";
    }

    return "idle";
  }

  async retryPendingEntries(): Promise<AuditSyncResult> {
    if (this.retryInFlight) {
      return {
        ...EMPTY_AUDIT_SYNC_RESULT,
        status: "retrying",
        remaining: this.pendingQueue.count(),
        lastError: "Retry já em andamento",
        completedAt: new Date().toISOString(),
        skipped: true,
        skipReason: "retry_in_flight",
      };
    }

    if (!this.config.isSupabaseConfigured || !this.supabaseAdapter) {
      const result: AuditSyncResult = {
        status: "idle",
        attempted: 0,
        succeeded: 0,
        failed: 0,
        remaining: this.pendingQueue.count(),
        lastError: null,
        completedAt: new Date().toISOString(),
        skipped: true,
        skipReason: "supabase_not_configured",
      };
      this.lastSyncResult = result;
      return result;
    }

    this.retryInFlight = true;
    this.syncStatus = "retrying";

    const pending = this.pendingQueue.list();
    let succeeded = 0;
    let failed = 0;
    let lastError: string | null = null;

    for (const item of pending) {
      const outcome = await this.retrySingleEntry(item);
      if (outcome.success) {
        succeeded += 1;
        this.pendingQueue.remove(item.id);
      } else {
        failed += 1;
        lastError = outcome.error ?? lastError;
      }
    }

    const remaining = this.pendingQueue.count();
    const completedAt = new Date().toISOString();
    const status: AuditRetryStatus =
      remaining === 0
        ? succeeded > 0 || pending.length === 0
          ? "synced"
          : "idle"
        : failed > 0
          ? "failed"
          : "pending";

    this.syncStatus = status;
    this.lastRetryAt = completedAt;
    this.lastRetryError = lastError;
    this.retryInFlight = false;

    const result: AuditSyncResult = {
      status,
      attempted: pending.length,
      succeeded,
      failed,
      remaining,
      lastError,
      completedAt,
    };
    this.lastSyncResult = result;
    return result;
  }

  private async retrySingleEntry(
    pending: AuditPendingEntry,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.supabaseAdapter) {
      return { success: false, error: "Adapter Supabase indisponível" };
    }

    const attemptAt = new Date().toISOString();
    const result = await this.supabaseAdapter.appendAsync(pending.entry);

    if (result.success) {
      return { success: true };
    }

    const nextAttemptCount = pending.attemptCount + 1;
    this.pendingQueue.update({
      ...pending,
      lastAttemptAt: attemptAt,
      attemptCount: nextAttemptCount,
      lastError: result.error ?? "Falha ao persistir audit no Supabase",
      errorCode: result.errorCode ?? pending.errorCode ?? null,
    });

    return {
      success: false,
      error: result.error ?? "Falha ao persistir audit no Supabase",
    };
  }
}

export function createAuditSyncManager(
  pendingQueue: AuditPendingQueue,
  supabaseAdapter: SupabaseAuditPersistenceAdapter | null,
  config?: Partial<AuditSyncManagerConfig>,
): AuditSyncManager {
  return new AuditSyncManager(pendingQueue, supabaseAdapter, config);
}
