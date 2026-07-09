import type { AuditPersistenceConfig } from "./AuditPersistenceConfig";
import { DEFAULT_AUDIT_PERSISTENCE_CONFIG } from "./AuditPersistenceConfig";
import type { AuditPersistenceStatus } from "./AuditPersistenceStatus";
import {
  DEFAULT_AUDIT_PERSISTENCE_STATUS,
  syncLegacyPersistenceStatusFields,
} from "./AuditPersistenceStatus";
import type { AuditEntry, AuditPersistenceAdapter } from "./AuditTypes";

interface PersistedAuditSnapshot {
  version: 1;
  entries: AuditEntry[];
  updatedAt: string;
}

function isAuditEntry(value: unknown): value is AuditEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as AuditEntry;
  return (
    typeof entry.id === "string" &&
    typeof entry.timestamp === "string" &&
    typeof entry.actor === "string" &&
    typeof entry.action === "string"
  );
}

export class LocalStorageAuditPersistenceAdapter implements AuditPersistenceAdapter {
  private readonly config: AuditPersistenceConfig;
  private status: AuditPersistenceStatus;

  constructor(config: Partial<AuditPersistenceConfig> = {}) {
    this.config = { ...DEFAULT_AUDIT_PERSISTENCE_CONFIG, ...config };
    this.status = syncLegacyPersistenceStatusFields({
      ...DEFAULT_AUDIT_PERSISTENCE_STATUS,
      enabled: this.config.enabled,
      mode: "localStorage",
      activeAdapter: this.config.enabled ? "localStorage" : "none",
      fallbackUsed: false,
      supabaseConfigured: false,
      supabaseTableReady: null,
    });
  }

  getStatus(): AuditPersistenceStatus {
    return this.status;
  }

  private readEntries(): AuditEntry[] {
    if (!this.config.enabled || typeof window === "undefined") {
      return [];
    }

    const raw = window.localStorage.getItem(this.config.storageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as PersistedAuditSnapshot;
    if (!Array.isArray(parsed.entries)) return [];

    return parsed.entries.filter(isAuditEntry).slice(0, this.config.maxEntries);
  }

  private writeEntries(entries: AuditEntry[]): void {
    const snapshot: PersistedAuditSnapshot = {
      version: 1,
      entries: entries.slice(0, this.config.maxEntries),
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(this.config.storageKey, JSON.stringify(snapshot));
    this.status = syncLegacyPersistenceStatusFields({
      ...this.status,
      persistedCount: snapshot.entries.length,
      lastPersistedAt: snapshot.updatedAt,
      lastError: null,
    });
  }

  hydrate(): AuditEntry[] {
    if (!this.config.enabled || typeof window === "undefined") {
      return [];
    }

    try {
      const entries = this.readEntries();
      this.status = syncLegacyPersistenceStatusFields({
        ...this.status,
        persistedCount: entries.length,
        lastHydratedAt: new Date().toISOString(),
        lastError: null,
      });
      return entries;
    } catch (error) {
      this.status = syncLegacyPersistenceStatusFields({
        ...this.status,
        lastError: error instanceof Error ? error.message : "Failed to hydrate audit log",
      });
      return [];
    }
  }

  append(entry: AuditEntry): void {
    if (!this.config.enabled || typeof window === "undefined") {
      return;
    }

    try {
      const persistedEntry: AuditEntry = {
        ...entry,
        metadata: { ...entry.metadata, persistedLocally: true },
      };
      const merged = [
        persistedEntry,
        ...this.readEntries().filter((item) => item.id !== entry.id),
      ].slice(0, this.config.maxEntries);

      this.writeEntries(merged);
    } catch (error) {
      this.status = syncLegacyPersistenceStatusFields({
        ...this.status,
        lastError: error instanceof Error ? error.message : "Failed to persist audit entry",
      });
    }
  }

  query(limit = 50): AuditEntry[] {
    try {
      return this.readEntries().slice(0, limit);
    } catch {
      return [];
    }
  }
}

export function createLocalStorageAuditPersistenceAdapter(
  config?: Partial<AuditPersistenceConfig>,
): LocalStorageAuditPersistenceAdapter {
  return new LocalStorageAuditPersistenceAdapter(config);
}
