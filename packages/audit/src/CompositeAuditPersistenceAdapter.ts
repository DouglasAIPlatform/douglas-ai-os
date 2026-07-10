import type { SupabaseClient } from "@supabase/supabase-js";
import { createAuditPendingEntry } from "./AuditPendingEntry";
import type { AuditPersistenceConfig } from "./AuditPersistenceConfig";
import { DEFAULT_AUDIT_PERSISTENCE_CONFIG } from "./AuditPersistenceConfig";
import type { AuditPersistenceMode } from "./AuditPersistenceMode";
import {
  resolveEffectiveAuditPersistenceMode,
  shouldAttemptSupabaseWrite,
  shouldWriteToLocalStorage,
} from "./AuditPersistenceMode";
import type { AuditPersistenceStatus } from "./AuditPersistenceStatus";
import {
  DEFAULT_AUDIT_PERSISTENCE_STATUS,
  syncLegacyPersistenceStatusFields,
} from "./AuditPersistenceStatus";
import type { AuditSyncResult } from "./AuditSyncResult";
import { AuditSyncManager } from "./AuditSyncManager";
import type { AuditPendingCleanupResult } from "./AuditPendingCleanupResult";
import { AuditPendingQueueCleanup } from "./AuditPendingQueueCleanup";
import type { AuditEntry, AuditPersistenceAdapter } from "./AuditTypes";
import {
  createLocalStorageAuditPersistenceAdapter,
  LocalStorageAuditPersistenceAdapter,
} from "./LocalStorageAuditPersistenceAdapter";
import {
  createLocalStorageAuditPendingQueue,
  LocalStorageAuditPendingQueue,
} from "./LocalStorageAuditPendingQueue";
import type { SupabaseAuditPersistenceConfig } from "./SupabaseAuditPersistenceConfig";
import { DEFAULT_SUPABASE_AUDIT_PERSISTENCE_CONFIG } from "./SupabaseAuditPersistenceConfig";
import {
  createSupabaseAuditPersistenceAdapter,
  SupabaseAuditPersistenceAdapter,
} from "./SupabaseAuditPersistenceAdapter";

export interface CompositeAuditPersistenceConfig {
  mode: AuditPersistenceMode;
  isSupabaseConfigured: boolean;
  localStorage?: Partial<AuditPersistenceConfig>;
  supabase?: Partial<SupabaseAuditPersistenceConfig>;
}

export interface AuditPersistenceAdapterWithStatus extends AuditPersistenceAdapter {
  getStatus(): AuditPersistenceStatus;
  hydrate(): AuditEntry[] | Promise<AuditEntry[]>;
  initialize?(): Promise<void>;
  retryPendingEntries?(): Promise<AuditSyncResult>;
  clearResolvedPendingEntries?(): AuditPendingCleanupResult;
  clearStaleFailedPendingEntries?(): AuditPendingCleanupResult;
  onStatusChange?(listener: () => void): () => void;
}

export class CompositeAuditPersistenceAdapter implements AuditPersistenceAdapterWithStatus {
  private readonly effectiveMode: AuditPersistenceMode;
  private readonly localAdapter: LocalStorageAuditPersistenceAdapter;
  private readonly supabaseAdapter: SupabaseAuditPersistenceAdapter | null;
  private readonly pendingQueue: LocalStorageAuditPendingQueue;
  private readonly syncManager: AuditSyncManager;
  private readonly pendingQueueCleanup: AuditPendingQueueCleanup;
  private readonly isSupabaseConfigured: boolean;
  private readonly statusListeners = new Set<() => void>();
  private fallbackUsed = false;
  private supabaseTableReady: boolean | null = null;
  private lastSyncAt: string | null = null;
  private lastError: string | null = null;
  private initialized = false;

  constructor(
    client: SupabaseClient | null,
    config: CompositeAuditPersistenceConfig,
  ) {
    this.isSupabaseConfigured = config.isSupabaseConfigured;
    this.effectiveMode = resolveEffectiveAuditPersistenceMode(
      config.mode,
      config.isSupabaseConfigured,
    );

    this.localAdapter = createLocalStorageAuditPersistenceAdapter({
      ...DEFAULT_AUDIT_PERSISTENCE_CONFIG,
      ...config.localStorage,
      enabled: shouldWriteToLocalStorage(this.effectiveMode),
    });

    this.pendingQueue = createLocalStorageAuditPendingQueue();

    const supabaseEnabled =
      shouldAttemptSupabaseWrite(this.effectiveMode, client !== null) &&
      (config.supabase?.enabled ?? true);

    this.supabaseAdapter =
      supabaseEnabled && client
        ? createSupabaseAuditPersistenceAdapter(client, {
            ...DEFAULT_SUPABASE_AUDIT_PERSISTENCE_CONFIG,
            ...config.supabase,
            enabled: true,
          })
        : null;

    this.syncManager = new AuditSyncManager(this.pendingQueue, this.supabaseAdapter, {
      isSupabaseConfigured: this.isSupabaseConfigured,
    });
    this.pendingQueueCleanup = new AuditPendingQueueCleanup(this.pendingQueue);
  }

  onStatusChange(listener: () => void): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatusChange(): void {
    this.statusListeners.forEach((listener) => listener());
  }

  getStatus(): AuditPersistenceStatus {
    const localStatus = this.localAdapter.getStatus();
    const supabaseStatus = this.supabaseAdapter?.getStatus();
    const syncState = this.syncManager.getState();
    const cleanupState = this.pendingQueueCleanup.getState();

    const activeAdapter: AuditPersistenceStatus["activeAdapter"] =
      this.effectiveMode === "localStorage" || !this.supabaseAdapter
        ? "localStorage"
        : this.fallbackUsed || this.supabaseTableReady === false
          ? "composite"
          : this.effectiveMode === "supabase"
            ? "supabase"
            : "composite";

    return syncLegacyPersistenceStatusFields({
      enabled: localStatus.enabled || (supabaseStatus?.enabled ?? false),
      mode: this.effectiveMode,
      activeAdapter,
      fallbackUsed: this.fallbackUsed,
      supabaseConfigured: this.isSupabaseConfigured,
      supabaseTableReady: this.supabaseTableReady,
      persistedCount: Math.max(
        localStatus.persistedCount,
        supabaseStatus?.persistedCount ?? 0,
      ),
      pendingEntries: this.pendingQueue.count(),
      lastPersistedAt:
        localStatus.lastPersistedAt ?? supabaseStatus?.lastPersistedAt ?? null,
      lastHydratedAt:
        localStatus.lastHydratedAt ?? supabaseStatus?.lastHydratedAt ?? null,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError ?? supabaseStatus?.lastError ?? localStatus.lastError,
      supabaseWriteMode: supabaseStatus?.supabaseWriteMode,
      lastRemoteStatus: supabaseStatus?.lastRemoteStatus ?? null,
      lastRemoteErrorCode: supabaseStatus?.lastRemoteErrorCode ?? null,
      edgeFunctionNotDeployed: supabaseStatus?.edgeFunctionNotDeployed ?? false,
      syncStatus: syncState.syncStatus,
      lastRetryAt: syncState.lastRetryAt,
      lastRetryError: syncState.lastRetryError,
      lastSyncResult: syncState.lastSyncResult,
      pendingQueueError: this.pendingQueue.getLastQueueError(),
      pendingQueueStats: this.pendingQueueCleanup.getStats(),
      lastCleanupAt: cleanupState.lastCleanupAt,
      lastCleanupResult: cleanupState.lastCleanupResult,
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    this.pendingQueue.hydrate();

    if (!this.supabaseAdapter) {
      this.supabaseTableReady = null;
      this.notifyStatusChange();
      return;
    }

    const probe = await this.supabaseAdapter.probeTableReady();
    this.supabaseTableReady = probe.ready;

    if (!probe.ready) {
      this.fallbackUsed = true;
      this.lastError = probe.error;
    }

    this.notifyStatusChange();
  }

  hydrate(): AuditEntry[] {
    return this.localAdapter.hydrate();
  }

  async hydrateRemote(): Promise<AuditEntry[]> {
    if (!this.supabaseAdapter || this.supabaseTableReady === false) {
      return [];
    }

    return this.supabaseAdapter.hydrate();
  }

  append(entry: AuditEntry): void {
    if (shouldWriteToLocalStorage(this.effectiveMode)) {
      this.localAdapter.append(entry);
    }

    if (
      !this.supabaseAdapter ||
      !shouldAttemptSupabaseWrite(this.effectiveMode, true) ||
      this.supabaseTableReady === false
    ) {
      return;
    }

    void this.appendToSupabase(entry);
  }

  async retryPendingEntries(): Promise<AuditSyncResult> {
    const result = await this.syncManager.retryPendingEntries();

    if (result.succeeded > 0) {
      this.lastSyncAt = result.completedAt;
      if (result.remaining === 0) {
        this.lastError = null;
      }
    }

    if (result.lastError) {
      this.fallbackUsed = true;
      this.lastError = result.lastError;
    }

    this.notifyStatusChange();
    return result;
  }

  clearResolvedPendingEntries(): AuditPendingCleanupResult {
    const result = this.pendingQueueCleanup.clearResolved();
    this.notifyStatusChange();
    return result;
  }

  clearStaleFailedPendingEntries(): AuditPendingCleanupResult {
    const result = this.pendingQueueCleanup.clearStaleFailed();
    this.notifyStatusChange();
    return result;
  }

  private async appendToSupabase(entry: AuditEntry): Promise<void> {
    if (!this.supabaseAdapter) return;

    const result = await this.supabaseAdapter.appendAsync(entry);

    if (result.success) {
      this.lastSyncAt = new Date().toISOString();
      this.lastError = null;
      this.pendingQueue.remove(entry.id);
      this.notifyStatusChange();
      return;
    }

    this.fallbackUsed = true;
    this.lastError = result.error ?? "Falha ao persistir audit no Supabase";

    this.pendingQueue.enqueue(
      createAuditPendingEntry(entry, {
        lastError: this.lastError,
        errorCode: result.errorCode ?? null,
        ids: {
          auditId: result.auditId,
          requestId: result.requestId,
          correlationId: result.correlationId,
        },
      }),
    );

    if (result.tableMissing) {
      this.supabaseTableReady = false;
    }

    this.notifyStatusChange();
  }

  query(limit = 50): AuditEntry[] {
    return this.localAdapter.query(limit);
  }
}

export function createCompositeAuditPersistenceAdapter(
  client: SupabaseClient | null,
  config: CompositeAuditPersistenceConfig,
): CompositeAuditPersistenceAdapter {
  return new CompositeAuditPersistenceAdapter(client, config);
}

export function isAuditPersistenceAdapterWithStatus(
  adapter: AuditPersistenceAdapter | undefined,
): adapter is AuditPersistenceAdapterWithStatus {
  return (
    adapter !== undefined &&
    typeof (adapter as AuditPersistenceAdapterWithStatus).getStatus === "function"
  );
}

export function readAuditPersistenceStatus(
  adapter: AuditPersistenceAdapter | undefined,
): AuditPersistenceStatus {
  if (isAuditPersistenceAdapterWithStatus(adapter)) {
    return adapter.getStatus();
  }
  return DEFAULT_AUDIT_PERSISTENCE_STATUS;
}
