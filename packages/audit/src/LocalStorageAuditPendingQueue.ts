import type { AuditPendingEntry } from "./AuditPendingEntry";
import { isAuditPendingEntry } from "./AuditPendingEntry";
import type { AuditPendingQueue } from "./AuditPendingQueue";
import type { AuditRetryPolicy } from "./AuditRetryPolicy";
import { DEFAULT_AUDIT_RETRY_POLICY } from "./AuditRetryPolicy";

export const DEFAULT_AUDIT_PENDING_QUEUE_STORAGE_KEY =
  "douglas-ai-os:audit-pending-queue";

interface PersistedPendingQueueSnapshot {
  version: 1;
  entries: AuditPendingEntry[];
  updatedAt: string;
}

export interface LocalStorageAuditPendingQueueConfig {
  enabled: boolean;
  storageKey: string;
  policy: AuditRetryPolicy;
}

export const DEFAULT_LOCAL_STORAGE_AUDIT_PENDING_QUEUE_CONFIG: LocalStorageAuditPendingQueueConfig =
  {
    enabled: true,
    storageKey: DEFAULT_AUDIT_PENDING_QUEUE_STORAGE_KEY,
    policy: DEFAULT_AUDIT_RETRY_POLICY,
  };

export class LocalStorageAuditPendingQueue implements AuditPendingQueue {
  private readonly config: LocalStorageAuditPendingQueueConfig;
  private entries: AuditPendingEntry[] = [];
  private lastQueueError: string | null = null;
  private hydrated = false;

  constructor(config: Partial<LocalStorageAuditPendingQueueConfig> = {}) {
    this.config = {
      ...DEFAULT_LOCAL_STORAGE_AUDIT_PENDING_QUEUE_CONFIG,
      ...config,
      policy: {
        ...DEFAULT_AUDIT_RETRY_POLICY,
        ...config.policy,
      },
    };
  }

  getLastQueueError(): string | null {
    return this.lastQueueError;
  }

  private ensureHydrated(): void {
    if (this.hydrated) return;
    this.entries = this.readFromStorage();
    this.hydrated = true;
  }

  private readFromStorage(): AuditPendingEntry[] {
    if (!this.config.enabled || typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(this.config.storageKey);
      if (!raw) return [];

      const parsed = JSON.parse(raw) as PersistedPendingQueueSnapshot;
      if (!Array.isArray(parsed.entries)) return [];

      this.lastQueueError = null;
      return parsed.entries.filter(isAuditPendingEntry).slice(0, this.config.policy.maxEntries);
    } catch (error) {
      this.lastQueueError =
        error instanceof Error ? error.message : "Falha ao ler fila de pendências de audit";
      return [];
    }
  }

  private writeToStorage(): void {
    if (!this.config.enabled || typeof window === "undefined") {
      return;
    }

    try {
      const snapshot: PersistedPendingQueueSnapshot = {
        version: 1,
        entries: this.entries.slice(0, this.config.policy.maxEntries),
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(this.config.storageKey, JSON.stringify(snapshot));
      this.lastQueueError = null;
    } catch (error) {
      this.lastQueueError =
        error instanceof Error ? error.message : "Falha ao persistir fila de pendências de audit";
    }
  }

  hydrate(): AuditPendingEntry[] {
    this.ensureHydrated();
    return [...this.entries];
  }

  list(): AuditPendingEntry[] {
    this.ensureHydrated();
    return [...this.entries];
  }

  count(): number {
    this.ensureHydrated();
    return this.entries.length;
  }

  enqueue(entry: AuditPendingEntry): void {
    this.ensureHydrated();
    this.entries = [
      entry,
      ...this.entries.filter((item) => item.id !== entry.id),
    ].slice(0, this.config.policy.maxEntries);
    this.writeToStorage();
  }

  remove(id: string): void {
    this.ensureHydrated();
    this.entries = this.entries.filter((item) => item.id !== id);
    this.writeToStorage();
  }

  update(entry: AuditPendingEntry): void {
    this.ensureHydrated();
    const index = this.entries.findIndex((item) => item.id === entry.id);
    if (index === -1) {
      this.enqueue(entry);
      return;
    }

    const next = [...this.entries];
    next[index] = entry;
    this.entries = next;
    this.writeToStorage();
  }

  clear(): void {
    this.entries = [];
    this.hydrated = true;
    this.writeToStorage();
  }
}

export function createLocalStorageAuditPendingQueue(
  config?: Partial<LocalStorageAuditPendingQueueConfig>,
): LocalStorageAuditPendingQueue {
  return new LocalStorageAuditPendingQueue(config);
}
