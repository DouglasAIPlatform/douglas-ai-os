import type { AuditEntry } from "./AuditTypes";

const DEFAULT_CAPACITY = 200;

export interface AuditStoreOptions {
  capacity?: number;
}

export class AuditStore {
  private entries: AuditEntry[] = [];
  private listeners = new Set<() => void>();
  private readonly capacity: number;

  constructor(options: AuditStoreOptions = {}) {
    this.capacity = options.capacity ?? DEFAULT_CAPACITY;
  }

  append(entry: AuditEntry): void {
    this.entries = [entry, ...this.entries.filter((item) => item.id !== entry.id)].slice(
      0,
      this.capacity,
    );
    this.listeners.forEach((listener) => listener());
  }

  prependEntries(entries: AuditEntry[]): void {
    const merged = new Map<string, AuditEntry>();
    for (const entry of [...entries, ...this.entries]) {
      merged.set(entry.id, entry);
    }
    this.entries = [...merged.values()]
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
      .slice(0, this.capacity);
    this.listeners.forEach((listener) => listener());
  }

  query(limit = 50): AuditEntry[] {
    return this.entries.slice(0, limit);
  }

  getCount(): number {
    return this.entries.length;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export function createAuditStore(options?: AuditStoreOptions): AuditStore {
  return new AuditStore(options);
}
