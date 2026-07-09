import type {
  MemoryHistoryAction,
  MemoryHistoryEntry,
  MemoryRecord,
} from "./MemoryTypes";

export class MemoryHistory {
  private entries: MemoryHistoryEntry[] = [];
  private readonly capacity: number;

  constructor(capacity = 500) {
    this.capacity = capacity;
  }

  record(
    action: MemoryHistoryAction,
    snapshot: MemoryRecord,
  ): MemoryHistoryEntry {
    const entry: MemoryHistoryEntry = {
      id: `history:${Date.now()}:${this.entries.length}`,
      action,
      recordId: snapshot.id,
      snapshot,
      createdAt: new Date().toISOString(),
      backendId: snapshot.backendId,
    };

    this.entries = [entry, ...this.entries].slice(0, this.capacity);
    return entry;
  }

  getByRecordId(recordId: string): MemoryHistoryEntry[] {
    return this.entries.filter((entry) => entry.recordId === recordId);
  }

  getByBackendId(backendId: string): MemoryHistoryEntry[] {
    return this.entries.filter((entry) => entry.backendId === backendId);
  }

  getRecent(limit = 20): MemoryHistoryEntry[] {
    return this.entries.slice(0, limit);
  }

  getAll(): MemoryHistoryEntry[] {
    return [...this.entries];
  }

  count(): number {
    return this.entries.length;
  }

  clear(): void {
    this.entries = [];
  }
}
