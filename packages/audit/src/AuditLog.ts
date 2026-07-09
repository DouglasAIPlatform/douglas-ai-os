import type { AuditPersistenceStatus } from "./AuditPersistenceStatus";
import { DEFAULT_AUDIT_PERSISTENCE_STATUS } from "./AuditPersistenceStatus";
import type { AuditEntry, AuditPersistenceAdapter } from "./AuditTypes";
import { AuditStore, type AuditStoreOptions } from "./AuditStore";
import { readAuditPersistenceStatus } from "./CompositeAuditPersistenceAdapter";

let auditEntryCounter = 0;

export interface AuditLogOptions {
  store?: AuditStore;
  storeOptions?: AuditStoreOptions;
  persistence?: AuditPersistenceAdapter;
}

export class AuditLog {
  readonly store: AuditStore;
  private readonly persistence?: AuditPersistenceAdapter;

  constructor(options: AuditLogOptions = {}) {
    this.store = options.store ?? new AuditStore(options.storeOptions);
    this.persistence = options.persistence;
  }

  hydrate(entries: AuditEntry[]): void {
    if (!entries.length) return;
    this.store.prependEntries(entries);
  }

  getPersistenceStatus(): AuditPersistenceStatus {
    return readAuditPersistenceStatus(this.persistence);
  }

  record(
    entry: Omit<AuditEntry, "id" | "timestamp"> & Partial<Pick<AuditEntry, "id" | "timestamp">>,
  ): AuditEntry {
    auditEntryCounter += 1;
    const full: AuditEntry = {
      id: entry.id ?? `op-audit-${auditEntryCounter}`,
      timestamp: entry.timestamp ?? new Date().toISOString(),
      actor: entry.actor,
      role: entry.role,
      source: entry.source,
      action: entry.action,
      target: entry.target,
      severity: entry.severity,
      message: entry.message,
      metadata: entry.metadata,
    };

    this.store.append(full);
    this.persistence?.append(full);

    return full;
  }

  getRecent(limit = 50): AuditEntry[] {
    return this.store.query(limit);
  }

  getCount(): number {
    return this.store.getCount();
  }

  subscribe(listener: () => void): () => void {
    return this.store.subscribe(listener);
  }
}

export function createAuditLog(options?: AuditLogOptions): AuditLog {
  return new AuditLog(options);
}
