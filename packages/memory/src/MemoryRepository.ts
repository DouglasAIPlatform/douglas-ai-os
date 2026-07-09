import type {
  MemoryFilter,
  MemoryRecord,
  MemoryWriteInput,
} from "./MemoryTypes";

export interface MemoryRepository {
  readonly backendId: string;
  write(input: MemoryWriteInput): MemoryRecord;
  read(id: string): MemoryRecord | undefined;
  update(id: string, patch: Partial<MemoryWriteInput>): MemoryRecord | undefined;
  delete(id: string): boolean;
  list(filter?: MemoryFilter): MemoryRecord[];
  count(filter?: MemoryFilter): number;
}

function matchesFilter(record: MemoryRecord, filter: MemoryFilter = {}): boolean {
  if (filter.tier && record.tier !== filter.tier) return false;
  if (filter.domain && record.domain !== filter.domain) return false;
  if (filter.kind && record.kind !== filter.kind) return false;
  if (filter.workspaceId && record.workspaceId !== filter.workspaceId) return false;
  if (filter.sourceId && record.sourceId !== filter.sourceId) return false;
  if (filter.agentId && record.agentId !== filter.agentId) return false;
  if (filter.projectId && record.projectId !== filter.projectId) return false;
  if (filter.conversationId && record.conversationId !== filter.conversationId) {
    return false;
  }
  if (filter.backendId && record.backendId !== filter.backendId) return false;
  if (filter.tag && !record.tags.includes(filter.tag)) return false;
  return true;
}

export class InMemoryMemoryRepository implements MemoryRepository {
  private records = new Map<string, MemoryRecord>();

  constructor(readonly backendId: string) {}

  seed(records: MemoryRecord[]): void {
    records.forEach((record) => {
      this.records.set(record.id, { ...record, backendId: this.backendId });
    });
  }

  write(input: MemoryWriteInput): MemoryRecord {
    const now = new Date().toISOString();
    const record: MemoryRecord = {
      id: `memory:${this.backendId}:${Date.now()}:${this.records.size}`,
      tier: input.tier,
      domain: input.domain,
      kind: input.kind,
      content: input.content,
      workspaceId: input.workspaceId,
      sourceId: input.sourceId,
      agentId: input.agentId,
      projectId: input.projectId,
      conversationId: input.conversationId,
      tags: input.tags ?? [],
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
      expiresAt: input.expiresAt,
      backendId: this.backendId,
    };

    this.records.set(record.id, record);
    return record;
  }

  read(id: string): MemoryRecord | undefined {
    return this.records.get(id);
  }

  update(id: string, patch: Partial<MemoryWriteInput>): MemoryRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;

    const updated: MemoryRecord = {
      ...current,
      tier: patch.tier ?? current.tier,
      domain: patch.domain ?? current.domain,
      kind: patch.kind ?? current.kind,
      content: patch.content ?? current.content,
      workspaceId: patch.workspaceId ?? current.workspaceId,
      sourceId: patch.sourceId ?? current.sourceId,
      agentId: patch.agentId ?? current.agentId,
      projectId: patch.projectId ?? current.projectId,
      conversationId: patch.conversationId ?? current.conversationId,
      tags: patch.tags ?? current.tags,
      metadata: patch.metadata ?? current.metadata,
      expiresAt: patch.expiresAt ?? current.expiresAt,
      updatedAt: new Date().toISOString(),
    };

    this.records.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.records.delete(id);
  }

  list(filter?: MemoryFilter): MemoryRecord[] {
    return Array.from(this.records.values()).filter((record) =>
      matchesFilter(record, filter),
    );
  }

  count(filter?: MemoryFilter): number {
    return this.list(filter).length;
  }

  getAll(): MemoryRecord[] {
    return Array.from(this.records.values());
  }
}
