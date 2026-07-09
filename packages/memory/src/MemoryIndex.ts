import type {
  MemoryDomain,
  MemoryFilter,
  MemoryIndexSnapshot,
  MemoryRecord,
  MemoryTier,
} from "./MemoryTypes";

export class MemoryIndex {
  private records = new Map<string, MemoryRecord>();
  private byDomain = new Map<MemoryDomain, Set<string>>();
  private byTier = new Map<MemoryTier, Set<string>>();
  private byWorkspace = new Map<string, Set<string>>();

  rebuild(records: MemoryRecord[]): void {
    this.clear();
    records.forEach((record) => this.add(record));
  }

  add(record: MemoryRecord): void {
    this.records.set(record.id, record);
    this.addToBucket(this.byDomain, record.domain, record.id);
    this.addToBucket(this.byTier, record.tier, record.id);
    this.addToBucket(this.byWorkspace, record.workspaceId, record.id);
  }

  remove(recordId: string): void {
    const record = this.records.get(recordId);
    if (!record) return;

    this.records.delete(recordId);
    this.removeFromBucket(this.byDomain, record.domain, recordId);
    this.removeFromBucket(this.byTier, record.tier, recordId);
    this.removeFromBucket(this.byWorkspace, record.workspaceId, recordId);
  }

  get(recordId: string): MemoryRecord | undefined {
    return this.records.get(recordId);
  }

  list(filter?: MemoryFilter): MemoryRecord[] {
    let candidateIds: Set<string> | null = null;

    if (filter?.domain) {
      candidateIds = this.intersect(candidateIds, this.byDomain.get(filter.domain));
    }

    if (filter?.tier) {
      candidateIds = this.intersect(candidateIds, this.byTier.get(filter.tier));
    }

    if (filter?.workspaceId) {
      candidateIds = this.intersect(
        candidateIds,
        this.byWorkspace.get(filter.workspaceId),
      );
    }

    const records = candidateIds
      ? Array.from(candidateIds)
          .map((id) => this.records.get(id))
          .filter((record): record is MemoryRecord => Boolean(record))
      : Array.from(this.records.values());

    return records.filter((record) => {
      if (filter?.kind && record.kind !== filter.kind) return false;
      if (filter?.agentId && record.agentId !== filter.agentId) return false;
      if (filter?.projectId && record.projectId !== filter.projectId) return false;
      if (filter?.conversationId && record.conversationId !== filter.conversationId) {
        return false;
      }
      if (filter?.backendId && record.backendId !== filter.backendId) return false;
      if (filter?.tag && !record.tags.includes(filter.tag)) return false;
      if (filter?.sourceId && record.sourceId !== filter.sourceId) return false;
      return true;
    });
  }

  snapshot(): MemoryIndexSnapshot {
    const domains: Record<MemoryDomain, number> = {
      project: this.byDomain.get("project")?.size ?? 0,
      agent: this.byDomain.get("agent")?.size ?? 0,
      conversation: this.byDomain.get("conversation")?.size ?? 0,
      platform: this.byDomain.get("platform")?.size ?? 0,
    };

    const tiers: Record<MemoryTier, number> = {
      short_term: this.byTier.get("short_term")?.size ?? 0,
      long_term: this.byTier.get("long_term")?.size ?? 0,
    };

    return {
      version: "0.1.0",
      recordCount: this.records.size,
      domains,
      tiers,
      generatedAt: new Date().toISOString(),
    };
  }

  size(): number {
    return this.records.size;
  }

  clear(): void {
    this.records.clear();
    this.byDomain.clear();
    this.byTier.clear();
    this.byWorkspace.clear();
  }

  private addToBucket<K>(map: Map<K, Set<string>>, key: K, recordId: string) {
    const bucket = map.get(key) ?? new Set<string>();
    bucket.add(recordId);
    map.set(key, bucket);
  }

  private removeFromBucket<K>(map: Map<K, Set<string>>, key: K, recordId: string) {
    map.get(key)?.delete(recordId);
  }

  private intersect(
    current: Set<string> | null,
    next: Set<string> | undefined,
  ): Set<string> {
    if (!next) return new Set();
    if (!current) return new Set(next);
    return new Set(Array.from(current).filter((id) => next.has(id)));
  }
}
