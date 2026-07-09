import { MemoryHistory } from "./MemoryHistory";
import { MemoryIndex } from "./MemoryIndex";
import { InMemoryMemoryRepository } from "./MemoryRepository";
import { MemorySearch } from "./MemorySearch";
import { MemoryStoreRegistry } from "./MemoryStoreRegistry";
import type {
  MemoryFilter,
  MemoryHistoryEntry,
  MemoryIndexSnapshot,
  MemoryRecord,
  MemorySearchQuery,
  MemorySearchResult,
  MemoryWriteInput,
} from "./MemoryTypes";

export class MemoryStore {
  private readonly index: MemoryIndex;
  private readonly history: MemoryHistory;
  private readonly memorySearch: MemorySearch;

  constructor(private readonly registry: MemoryStoreRegistry) {
    this.index = new MemoryIndex();
    this.history = new MemoryHistory();
    this.memorySearch = new MemorySearch();
    this.rebuildIndex();
  }

  getRegistry(): MemoryStoreRegistry {
    return this.registry;
  }

  getHistory(): MemoryHistory {
    return this.history;
  }

  getIndex(): MemoryIndex {
    return this.index;
  }

  seed(records: MemoryRecord[]): void {
    const grouped = new Map<string, MemoryRecord[]>();

    records.forEach((record) => {
      const bucket = grouped.get(record.backendId) ?? [];
      bucket.push(record);
      grouped.set(record.backendId, bucket);
    });

    grouped.forEach((backendRecords, backendId) => {
      const backend = this.registry.get(backendId);
      if (!backend) return;

      const repository = backend.repository;
      if (repository instanceof InMemoryMemoryRepository) {
        repository.seed(backendRecords);
      }
    });

    this.rebuildIndex();
  }

  write(input: MemoryWriteInput): MemoryRecord | null {
    const backend = this.registry.resolveBackend(input);
    if (!backend) return null;

    const record = backend.repository.write({
      ...input,
      backendId: backend.id,
    });

    this.index.add(record);
    this.history.record("created", record);
    return record;
  }

  read(id: string): MemoryRecord | undefined {
    return this.index.get(id) ?? this.findAcrossBackends(id);
  }

  update(id: string, patch: Partial<MemoryWriteInput>): MemoryRecord | null {
    const existing = this.read(id);
    if (!existing) return null;

    const backend = this.registry.get(existing.backendId);
    if (!backend) return null;

    const updated = backend.repository.update(id, patch);
    if (!updated) return null;

    this.index.add(updated);
    this.history.record("updated", updated);
    return updated;
  }

  delete(id: string): boolean {
    const existing = this.read(id);
    if (!existing) return false;

    const backend = this.registry.get(existing.backendId);
    if (!backend) return false;

    const deleted = backend.repository.delete(id);
    if (!deleted) return false;

    this.index.remove(id);
    this.history.record("deleted", existing);
    return true;
  }

  list(filter?: MemoryFilter): MemoryRecord[] {
    return this.index.list(filter);
  }

  search(query: MemorySearchQuery = {}): MemorySearchResult[] {
    const records = this.index.list(query.filter);
    return this.memorySearch.search(records, query);
  }

  getHistoryByRecord(recordId: string): MemoryHistoryEntry[] {
    return this.history.getByRecordId(recordId);
  }

  getRecentHistory(limit = 20): MemoryHistoryEntry[] {
    return this.history.getRecent(limit);
  }

  snapshot(): MemoryIndexSnapshot {
    return this.index.snapshot();
  }

  purgeExpired(now = new Date()): number {
    let removed = 0;

    this.registry.getAll().forEach((backend) => {
      const repo = backend.repository as {
        getAll?: () => MemoryRecord[];
      };

      if (!repo.getAll) return;

      repo.getAll().forEach((record) => {
        if (!record.expiresAt) return;
        if (new Date(record.expiresAt) > now) return;
        if (this.delete(record.id)) removed += 1;
      });
    });

    return removed;
  }

  private rebuildIndex(): void {
    const records = this.registry
      .getAll()
      .flatMap((backend) => backend.repository.list());

    this.index.rebuild(records);
  }

  private findAcrossBackends(id: string): MemoryRecord | undefined {
    for (const backend of this.registry.getAll()) {
      const record = backend.repository.read(id);
      if (record) {
        this.index.add(record);
        return record;
      }
    }

    return undefined;
  }
}
