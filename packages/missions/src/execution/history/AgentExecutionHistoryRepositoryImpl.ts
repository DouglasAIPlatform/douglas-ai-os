import {
  buildAgentExecutionMetricsSnapshot,
  countByOutcome,
  resolvePageLimit,
  resolvePageOffset,
  truncateToRetentionLimit,
  type AgentExecutionHistoryEntry,
  type AgentExecutionHistoryPage,
  type AgentExecutionHistoryQuery,
  type AgentExecutionHistoryRepository,
  type AgentExecutionHistoryScope,
  type AgentExecutionMetricsSnapshot,
  type AgentExecutionOutcomeCounts,
} from "@douglas/agents";
import type { MissionExecutionContext } from "../MissionExecutionTypes";
import {
  dedupeHistoryEntries,
  filterHistoryByAgent,
  missionContextToHistoryEntry,
  sortHistoryNewestFirst,
} from "./AgentExecutionHistoryMapper";

function paginateEntries(
  entries: AgentExecutionHistoryEntry[],
  limit: number,
  offset: number,
  scope: AgentExecutionHistoryScope,
  dataSource: AgentExecutionHistoryPage["dataSource"],
): AgentExecutionHistoryPage {
  const sorted = sortHistoryNewestFirst(entries);
  const total = sorted.length;
  const page = sorted.slice(offset, offset + limit);

  return {
    entries: page,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
    scope,
    dataSource,
  };
}

export class InMemoryAgentExecutionHistoryRepository
  implements AgentExecutionHistoryRepository
{
  private readonly store = new Map<string, AgentExecutionHistoryEntry[]>();

  seedFromContexts(contexts: MissionExecutionContext[]): void {
    for (const context of contexts) {
      const entry = missionContextToHistoryEntry(context, "session");
      const list = this.store.get(entry.agentId) ?? [];
      const filtered = list.filter((e) => e.executionId !== entry.executionId);
      filtered.unshift(entry);
      this.store.set(entry.agentId, filtered);
    }
  }

  private getEntries(agentId: string): AgentExecutionHistoryEntry[] {
    return this.store.get(agentId) ?? [];
  }

  async listByAgent(query: AgentExecutionHistoryQuery): Promise<AgentExecutionHistoryPage> {
    const limit = resolvePageLimit(query.limit);
    const offset = resolvePageOffset(query.offset);
    return paginateEntries(
      this.getEntries(query.agentId),
      limit,
      offset,
      query.scope ?? "session",
      "memory",
    );
  }

  async listRecent(
    agentId: string,
    limit?: number,
    scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionHistoryEntry[]> {
    const page = await this.listByAgent({ agentId, limit, scope: scope ?? "session" });
    return page.entries;
  }

  async getAgentMetrics(
    agentId: string,
    scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionMetricsSnapshot> {
    const entries = this.getEntries(agentId);
    return buildAgentExecutionMetricsSnapshot({
      agentId,
      entries,
      scope: scope ?? "session",
      dataSource: "memory",
    });
  }

  async getLastExecution(
    agentId: string,
    _scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionHistoryEntry | undefined> {
    return sortHistoryNewestFirst(this.getEntries(agentId))[0];
  }

  async countByOutcome(
    agentId: string,
    _scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionOutcomeCounts> {
    return countByOutcome(this.getEntries(agentId));
  }

  async paginate(query: AgentExecutionHistoryQuery): Promise<AgentExecutionHistoryPage> {
    return this.listByAgent(query);
  }
}

export class SessionAgentExecutionHistoryRepository
  implements AgentExecutionHistoryRepository
{
  constructor(
    private readonly listContexts: () => MissionExecutionContext[],
  ) {}

  private toEntries(scope: AgentExecutionHistoryScope): AgentExecutionHistoryEntry[] {
    return this.listContexts().map((ctx) => missionContextToHistoryEntry(ctx, scope));
  }

  async listByAgent(query: AgentExecutionHistoryQuery): Promise<AgentExecutionHistoryPage> {
    const scope = query.scope ?? "session";
    const limit = resolvePageLimit(query.limit);
    const offset = resolvePageOffset(query.offset);
    const filtered = filterHistoryByAgent(this.toEntries(scope), query.agentId);
    return paginateEntries(filtered, limit, offset, scope, "session");
  }

  async listRecent(
    agentId: string,
    limit?: number,
    scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionHistoryEntry[]> {
    const page = await this.listByAgent({ agentId, limit, scope: scope ?? "session" });
    return page.entries;
  }

  async getAgentMetrics(
    agentId: string,
    scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionMetricsSnapshot> {
    const entries = filterHistoryByAgent(
      this.toEntries(scope ?? "session"),
      agentId,
    );
    return buildAgentExecutionMetricsSnapshot({
      agentId,
      entries,
      scope: scope ?? "session",
      dataSource: "session",
    });
  }

  async getLastExecution(
    agentId: string,
    scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionHistoryEntry | undefined> {
    return sortHistoryNewestFirst(
      filterHistoryByAgent(this.toEntries(scope ?? "session"), agentId),
    )[0];
  }

  async countByOutcome(
    agentId: string,
    scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionOutcomeCounts> {
    return countByOutcome(
      filterHistoryByAgent(this.toEntries(scope ?? "session"), agentId),
    );
  }

  async paginate(query: AgentExecutionHistoryQuery): Promise<AgentExecutionHistoryPage> {
    return this.listByAgent(query);
  }
}

export interface PersistedExecutionListSource {
  listByAgent(agentId: string, limit: number, offset: number): Promise<MissionExecutionContext[]>;
  listRecent(limit: number): Promise<MissionExecutionContext[]>;
  getDataSource(): AgentExecutionHistoryPage["dataSource"];
}

export class PersistedAgentExecutionHistoryRepository
  implements AgentExecutionHistoryRepository
{
  constructor(private readonly source: PersistedExecutionListSource) {}

  private toEntries(contexts: MissionExecutionContext[]): AgentExecutionHistoryEntry[] {
    return contexts.map((ctx) => missionContextToHistoryEntry(ctx, "persisted"));
  }

  async listByAgent(query: AgentExecutionHistoryQuery): Promise<AgentExecutionHistoryPage> {
    const limit = resolvePageLimit(query.limit);
    const offset = resolvePageOffset(query.offset);
    const contexts = await this.source.listByAgent(query.agentId, limit + offset, 0);
    const entries = truncateToRetentionLimit(
      filterHistoryByAgent(this.toEntries(contexts), query.agentId),
      limit + offset,
    );
    return paginateEntries(entries, limit, offset, query.scope ?? "persisted", this.source.getDataSource());
  }

  async listRecent(
    agentId: string,
    limit?: number,
    scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionHistoryEntry[]> {
    const page = await this.listByAgent({
      agentId,
      limit,
      scope: scope ?? "persisted",
    });
    return page.entries;
  }

  async getAgentMetrics(
    agentId: string,
    scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionMetricsSnapshot> {
    const entries = filterHistoryByAgent(
      this.toEntries(await this.source.listByAgent(agentId, 100, 0)),
      agentId,
    );
    return buildAgentExecutionMetricsSnapshot({
      agentId,
      entries,
      scope: scope ?? "persisted",
      dataSource: this.source.getDataSource(),
    });
  }

  async getLastExecution(
    agentId: string,
    scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionHistoryEntry | undefined> {
    const recent = await this.listRecent(agentId, 1, scope ?? "persisted");
    return recent[0];
  }

  async countByOutcome(
    agentId: string,
    scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionOutcomeCounts> {
    const entries = filterHistoryByAgent(
      this.toEntries(await this.source.listByAgent(agentId, 100, 0)),
      agentId,
    );
    return countByOutcome(entries);
  }

  async paginate(query: AgentExecutionHistoryQuery): Promise<AgentExecutionHistoryPage> {
    return this.listByAgent(query);
  }
}

export class CompositeAgentExecutionHistoryRepository
  implements AgentExecutionHistoryRepository
{
  constructor(
    private readonly sessionRepo: SessionAgentExecutionHistoryRepository,
    private readonly persistedRepo: PersistedAgentExecutionHistoryRepository | null,
  ) {}

  private async resolveEntries(
    agentId: string,
    scope: AgentExecutionHistoryScope,
    limit: number,
  ): Promise<{ entries: AgentExecutionHistoryEntry[]; dataSource: AgentExecutionHistoryPage["dataSource"] }> {
    if (scope === "session") {
      const entries = await this.sessionRepo.listRecent(agentId, limit, "session");
      return { entries, dataSource: "session" };
    }

    if (scope === "persisted" && this.persistedRepo) {
      const entries = await this.persistedRepo.listRecent(agentId, limit, "persisted");
      return { entries, dataSource: "supabase" };
    }

    const sessionEntries = await this.sessionRepo.listRecent(agentId, limit, "session");
    const persistedEntries = this.persistedRepo
      ? await this.persistedRepo.listRecent(agentId, limit, "persisted")
      : [];

    const merged = dedupeHistoryEntries(
      sortHistoryNewestFirst([...sessionEntries, ...persistedEntries]),
    );

    const dataSource: AgentExecutionHistoryPage["dataSource"] =
      persistedEntries.length > 0 ? "composite" : "session";

    return { entries: truncateToRetentionLimit(merged, limit), dataSource };
  }

  async listByAgent(query: AgentExecutionHistoryQuery): Promise<AgentExecutionHistoryPage> {
    const scope = query.scope ?? "combined";
    const limit = resolvePageLimit(query.limit);
    const offset = resolvePageOffset(query.offset);
    const { entries, dataSource } = await this.resolveEntries(
      query.agentId,
      scope,
      limit + offset,
    );
    return paginateEntries(entries, limit, offset, scope, dataSource);
  }

  async listRecent(
    agentId: string,
    limit?: number,
    scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionHistoryEntry[]> {
    const page = await this.listByAgent({ agentId, limit, scope: scope ?? "combined" });
    return page.entries;
  }

  async getAgentMetrics(
    agentId: string,
    scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionMetricsSnapshot> {
    const resolvedScope = scope ?? "combined";
    const { entries, dataSource } = await this.resolveEntries(agentId, resolvedScope, 100);
    return buildAgentExecutionMetricsSnapshot({
      agentId,
      entries,
      scope: resolvedScope,
      dataSource,
    });
  }

  async getLastExecution(
    agentId: string,
    scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionHistoryEntry | undefined> {
    const recent = await this.listRecent(agentId, 1, scope ?? "combined");
    return recent[0];
  }

  async countByOutcome(
    agentId: string,
    scope?: AgentExecutionHistoryScope,
  ): Promise<AgentExecutionOutcomeCounts> {
    const { entries } = await this.resolveEntries(agentId, scope ?? "combined", 100);
    return countByOutcome(entries);
  }

  async paginate(query: AgentExecutionHistoryQuery): Promise<AgentExecutionHistoryPage> {
    return this.listByAgent(query);
  }
}

export function createCompositeAgentExecutionHistoryRepository(input: {
  listSessionContexts: () => MissionExecutionContext[];
  listByAgent?: (agentId: string, limit: number, offset: number) => Promise<MissionExecutionContext[]>;
  listRecent?: (limit: number) => Promise<MissionExecutionContext[]>;
  dataSource?: AgentExecutionHistoryPage["dataSource"];
}): CompositeAgentExecutionHistoryRepository {
  const sessionRepo = new SessionAgentExecutionHistoryRepository(input.listSessionContexts);

  const persistedRepo =
    input.listByAgent && input.listRecent
      ? new PersistedAgentExecutionHistoryRepository({
          listByAgent: input.listByAgent,
          listRecent: input.listRecent,
          getDataSource: () => input.dataSource ?? "supabase",
        })
      : null;

  return new CompositeAgentExecutionHistoryRepository(sessionRepo, persistedRepo);
}
