import type { MissionExecutionContext, MissionExecutionResult } from "./MissionExecutionTypes";

export interface MissionExecutionPersistenceAdapter {
  save(context: MissionExecutionContext): Promise<void> | void;
  load(executionId: string): Promise<MissionExecutionContext | undefined> | MissionExecutionContext | undefined;
  loadByMissionId(missionId: string): Promise<MissionExecutionContext | undefined> | MissionExecutionContext | undefined;
  saveResult(result: MissionExecutionResult): Promise<void> | void;
  list(): Promise<MissionExecutionContext[]> | MissionExecutionContext[];
}

export class InMemoryMissionExecutionPersistence implements MissionExecutionPersistenceAdapter {
  private readonly contexts = new Map<string, MissionExecutionContext>();
  private readonly results = new Map<string, MissionExecutionResult>();
  private readonly byMissionId = new Map<string, string>();

  save(context: MissionExecutionContext): void {
    this.contexts.set(context.executionId, context);
    this.byMissionId.set(context.missionId, context.executionId);
  }

  load(executionId: string): MissionExecutionContext | undefined {
    return this.contexts.get(executionId);
  }

  loadByMissionId(missionId: string): MissionExecutionContext | undefined {
    const executionId = this.byMissionId.get(missionId);
    return executionId ? this.contexts.get(executionId) : undefined;
  }

  saveResult(result: MissionExecutionResult): void {
    this.results.set(result.context.executionId, result);
    this.save(result.context);
  }

  list(): MissionExecutionContext[] {
    return [...this.contexts.values()];
  }

  getResult(executionId: string): MissionExecutionResult | undefined {
    return this.results.get(executionId);
  }
}

export class SessionMissionExecutionPersistence implements MissionExecutionPersistenceAdapter {
  private readonly storageKey: string;

  constructor(storageKey = "douglas:mission-execution") {
    this.storageKey = storageKey;
  }

  private readStore(): {
    contexts: Record<string, MissionExecutionContext>;
    results: Record<string, MissionExecutionResult>;
    byMissionId: Record<string, string>;
  } {
    if (typeof globalThis.sessionStorage === "undefined") {
      return { contexts: {}, results: {}, byMissionId: {} };
    }
    try {
      const raw = globalThis.sessionStorage.getItem(this.storageKey);
      if (!raw) return { contexts: {}, results: {}, byMissionId: {} };
      return JSON.parse(raw) as {
        contexts: Record<string, MissionExecutionContext>;
        results: Record<string, MissionExecutionResult>;
        byMissionId: Record<string, string>;
      };
    } catch {
      return { contexts: {}, results: {}, byMissionId: {} };
    }
  }

  private writeStore(store: {
    contexts: Record<string, MissionExecutionContext>;
    results: Record<string, MissionExecutionResult>;
    byMissionId: Record<string, string>;
  }): void {
    if (typeof globalThis.sessionStorage === "undefined") return;
    try {
      globalThis.sessionStorage.setItem(this.storageKey, JSON.stringify(store));
    } catch {
      // sessionStorage indisponível ou cheio — ignora silenciosamente
    }
  }

  save(context: MissionExecutionContext): void {
    const store = this.readStore();
    store.contexts[context.executionId] = context;
    store.byMissionId[context.missionId] = context.executionId;
    this.writeStore(store);
  }

  load(executionId: string): MissionExecutionContext | undefined {
    return this.readStore().contexts[executionId];
  }

  loadByMissionId(missionId: string): MissionExecutionContext | undefined {
    const store = this.readStore();
    const executionId = store.byMissionId[missionId];
    return executionId ? store.contexts[executionId] : undefined;
  }

  saveResult(result: MissionExecutionResult): void {
    const store = this.readStore();
    store.results[result.context.executionId] = result;
    store.contexts[result.context.executionId] = result.context;
    store.byMissionId[result.context.missionId] = result.context.executionId;
    this.writeStore(store);
  }

  list(): MissionExecutionContext[] {
    return Object.values(this.readStore().contexts);
  }
}

export class CompositeMissionExecutionPersistence implements MissionExecutionPersistenceAdapter {
  constructor(private readonly adapters: MissionExecutionPersistenceAdapter[]) {}

  async save(context: MissionExecutionContext): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.save(context);
    }
  }

  async load(executionId: string): Promise<MissionExecutionContext | undefined> {
    for (const adapter of this.adapters) {
      const found = await adapter.load(executionId);
      if (found) return found;
    }
    return undefined;
  }

  async loadByMissionId(missionId: string): Promise<MissionExecutionContext | undefined> {
    for (const adapter of this.adapters) {
      const found = await adapter.loadByMissionId(missionId);
      if (found) return found;
    }
    return undefined;
  }

  async saveResult(result: MissionExecutionResult): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.saveResult(result);
    }
  }

  async list(): Promise<MissionExecutionContext[]> {
    const primary = this.adapters[0];
    return primary ? await primary.list() : [];
  }
}
