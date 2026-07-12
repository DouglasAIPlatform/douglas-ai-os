import type { SupabaseClient } from "@supabase/supabase-js";
import type { MissionExecutionEventRecord } from "./MissionExecutionEventRecord";
import { buildMissionExecutionEventRecord } from "./MissionExecutionEventRecord";
import type { MissionExecutionPersistenceHealth } from "./MissionExecutionPersistenceHealth";
import { DEFAULT_MISSION_EXECUTION_PERSISTENCE_HEALTH } from "./MissionExecutionPersistenceHealth";
import type { MissionExecutionPersistenceMode } from "./MissionExecutionPersistenceMode";
import {
  isSupabaseMissionPersistenceRequired,
  resolveEffectiveMissionPersistenceMode,
  shouldAttemptSupabaseMissionPersistence,
  shouldUseSessionMissionPersistence,
} from "./MissionExecutionPersistenceMode";
import type { MissionExecutionPersistenceResult } from "./MissionExecutionPersistenceResult";
import { missionPersistenceOk } from "./MissionExecutionPersistenceResult";
import {
  MissionExecutionPendingQueue,
  MISSION_PERSISTENCE_PENDING_QUEUE_LIMIT,
} from "./MissionExecutionPendingQueue";
import {
  contextToTimelineEvent,
  type MissionExecutionPersistenceWriteMeta,
} from "./SupabaseMissionExecutionMapper";
import {
  createSupabaseMissionExecutionPersistence,
  SupabaseMissionExecutionPersistence,
} from "./SupabaseMissionExecutionPersistence";
import {
  SessionMissionExecutionPersistence,
  type MissionExecutionPersistenceAdapter,
} from "../MissionExecutionPersistenceAdapter";
import type {
  MissionExecutionContext,
  MissionExecutionResult,
} from "../MissionExecutionTypes";

export interface CompositeMissionExecutionPersistenceConfig {
  mode: MissionExecutionPersistenceMode;
  isSupabaseConfigured: boolean;
  sessionStorageKey?: string;
  pendingQueueKey?: string;
  defaultWriteMeta?: MissionExecutionPersistenceWriteMeta;
}

export interface MissionExecutionPersistenceAdapterWithStatus
  extends MissionExecutionPersistenceAdapter {
  getStatus(): MissionExecutionPersistenceHealth;
  initialize(): Promise<void>;
  retryPendingSync(): Promise<{ attempted: number; succeeded: number; remaining: number }>;
  listExecutionEvents(executionId: string): Promise<MissionExecutionEventRecord[]>;
  listRecentExecutions(limit?: number): Promise<MissionExecutionContext[]>;
  listExecutionsByAgent(agentId: string, limit?: number, offset?: number): Promise<MissionExecutionContext[]>;
  checkHealth(): Promise<MissionExecutionPersistenceHealth>;
  onStatusChange(listener: () => void): () => void;
}

export class CompositeMissionExecutionPersistence
  implements MissionExecutionPersistenceAdapterWithStatus
{
  private readonly effectiveMode: MissionExecutionPersistenceMode;
  private readonly sessionAdapter: SessionMissionExecutionPersistence;
  private readonly supabaseAdapter: SupabaseMissionExecutionPersistence | null;
  private readonly pendingQueue: MissionExecutionPendingQueue;
  private readonly defaultWriteMeta?: MissionExecutionPersistenceWriteMeta;
  private readonly statusListeners = new Set<() => void>();
  private eventSequences = new Map<string, number>();
  private fallbackActive = false;
  private lastSyncAt: string | null = null;
  private lastError: string | null = null;
  private lastPersistedAt: string | null = null;
  private lastHydratedAt: string | null = null;
  private initialized = false;

  constructor(
    client: SupabaseClient | null,
    config: CompositeMissionExecutionPersistenceConfig,
  ) {
    this.effectiveMode = resolveEffectiveMissionPersistenceMode(
      config.mode,
      config.isSupabaseConfigured,
    );
    this.defaultWriteMeta = config.defaultWriteMeta;
    this.sessionAdapter = new SessionMissionExecutionPersistence(config.sessionStorageKey);
    this.pendingQueue = new MissionExecutionPendingQueue(config.pendingQueueKey);

    const supabaseEnabled = shouldAttemptSupabaseMissionPersistence(
      this.effectiveMode,
      config.isSupabaseConfigured,
    );

    this.supabaseAdapter =
      supabaseEnabled && client
        ? createSupabaseMissionExecutionPersistence(client)
        : null;
  }

  onStatusChange(listener: () => void): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatusChange(): void {
    this.statusListeners.forEach((listener) => listener());
  }

  getStatus(): MissionExecutionPersistenceHealth {
    const supabaseReady = this.supabaseAdapter?.getTableReady() ?? null;
    const activeAdapter: MissionExecutionPersistenceHealth["activeAdapter"] =
      this.effectiveMode === "session_only" || !this.supabaseAdapter
        ? "session"
        : this.fallbackActive || supabaseReady === false
          ? "composite"
          : "supabase";

    return {
      ...DEFAULT_MISSION_EXECUTION_PERSISTENCE_HEALTH,
      enabled: true,
      mode: this.effectiveMode,
      activeAdapter,
      supabaseConfigured: this.supabaseAdapter !== null,
      supabaseTableReady: supabaseReady,
      fallbackActive: this.fallbackActive,
      pendingSyncCount: this.pendingQueue.count(),
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
      lastPersistedAt: this.lastPersistedAt,
      lastHydratedAt: this.lastHydratedAt,
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    if (this.supabaseAdapter) {
      const health = await this.supabaseAdapter.checkHealth();
      if (!health.supabaseTableReady) {
        this.fallbackActive = true;
        this.lastError = health.lastError;
      }
    }

    this.notifyStatusChange();
  }

  async checkHealth(): Promise<MissionExecutionPersistenceHealth> {
    if (this.supabaseAdapter) {
      await this.supabaseAdapter.checkHealth();
    }
    return this.getStatus();
  }

  private resolveWriteMeta(context: MissionExecutionContext): MissionExecutionPersistenceWriteMeta | null {
    const userId = context.createdByUserId ?? context.request.createdByUserId ?? this.defaultWriteMeta?.createdByUserId;
    if (!userId) {
      return this.defaultWriteMeta ?? null;
    }
    return {
      createdByUserId: userId,
      operatorProfileId:
        context.operatorProfileId ??
        context.request.operatorProfileId ??
        this.defaultWriteMeta?.operatorProfileId,
    };
  }

  private nextEventSequence(executionId: string): number {
    const current = this.eventSequences.get(executionId) ?? 0;
    const next = current + 1;
    this.eventSequences.set(executionId, next);
    return next;
  }

  async saveExecution(
    context: MissionExecutionContext,
  ): Promise<MissionExecutionPersistenceResult> {
    await this.save(context);
    return missionPersistenceOk();
  }

  save(context: MissionExecutionContext): void {
    if (shouldUseSessionMissionPersistence(this.effectiveMode)) {
      this.sessionAdapter.save(context);
      this.lastPersistedAt = new Date().toISOString();
    }

    void this.persistToSupabase(context);
  }

  private async persistToSupabase(context: MissionExecutionContext): Promise<void> {
    if (!this.supabaseAdapter || this.supabaseAdapter.getTableReady() === false) {
      if (isSupabaseMissionPersistenceRequired(this.effectiveMode)) {
        this.enqueueSave(context, this.lastError ?? "Supabase indisponível");
      }
      return;
    }

    const meta = this.resolveWriteMeta(context);
    if (!meta?.createdByUserId) {
      this.fallbackActive = true;
      this.lastError = "createdByUserId ausente para persistência Supabase";
      this.enqueueSave(context, this.lastError);
      this.notifyStatusChange();
      return;
    }

    const result = await this.supabaseAdapter.saveExecution(context, meta);
    if (!result.success) {
      this.fallbackActive = true;
      this.lastError = result.error ?? "Falha Supabase";
      this.enqueueSave(context, this.lastError);
      if (result.tableMissing) {
        this.fallbackActive = true;
      }
      this.notifyStatusChange();
      return;
    }

    const sequence = this.nextEventSequence(context.executionId);
    await this.supabaseAdapter.appendEvent(
      contextToTimelineEvent(context, sequence, `status:${context.status}`),
    );

    this.lastSyncAt = new Date().toISOString();
    this.lastError = null;
    this.notifyStatusChange();
  }

  private enqueueSave(context: MissionExecutionContext, error: string): void {
    const meta = this.resolveWriteMeta(context);
    this.pendingQueue.enqueue({
      id: `${context.executionId}:${Date.now()}`,
      kind: "save",
      executionId: context.executionId,
      context,
      meta: meta ?? undefined,
      attempts: 0,
      lastError: error,
      enqueuedAt: new Date().toISOString(),
    });
  }

  async load(executionId: string): Promise<MissionExecutionContext | undefined> {
    const remote = this.supabaseAdapter
      ? await this.supabaseAdapter.getExecution(executionId)
      : undefined;
    if (remote) return remote;
    return this.sessionAdapter.load(executionId);
  }

  async loadByMissionId(missionId: string): Promise<MissionExecutionContext | undefined> {
    const session = this.sessionAdapter.loadByMissionId(missionId);
    if (session) return session;

    const recent = await this.listRecentExecutions(50);
    return recent.find((item) => item.missionId === missionId);
  }

  saveResult(result: MissionExecutionResult): void {
    this.sessionAdapter.saveResult(result);
    this.lastPersistedAt = new Date().toISOString();
    void this.persistResultToSupabase(result);
  }

  private async persistResultToSupabase(result: MissionExecutionResult): Promise<void> {
    if (!this.supabaseAdapter || this.supabaseAdapter.getTableReady() === false) {
      if (isSupabaseMissionPersistenceRequired(this.effectiveMode)) {
        this.enqueueSave(result.context, this.lastError ?? "Supabase indisponível");
      }
      return;
    }

    const meta = this.resolveWriteMeta(result.context);
    if (!meta?.createdByUserId) {
      this.enqueueSave(result.context, "createdByUserId ausente");
      return;
    }

    const saveResult = await this.supabaseAdapter.saveResult(result, meta);
    if (!saveResult.success) {
      this.fallbackActive = true;
      this.lastError = saveResult.error ?? "Falha ao persistir resultado";
      this.enqueueSave(result.context, this.lastError);
      this.notifyStatusChange();
      return;
    }

    this.lastSyncAt = new Date().toISOString();
    this.notifyStatusChange();
  }

  async list(): Promise<MissionExecutionContext[]> {
    const remote = await this.listRecentExecutions(50);
    if (remote.length > 0) return remote;
    return this.sessionAdapter.list();
  }

  async listRecentExecutions(limit = 20): Promise<MissionExecutionContext[]> {
    if (this.supabaseAdapter && this.supabaseAdapter.getTableReady() !== false) {
      const remote = await this.supabaseAdapter.listRecentExecutions(limit);
      if (remote.length > 0) {
        this.lastHydratedAt = new Date().toISOString();
        return remote;
      }
    }
    return this.sessionAdapter.list().slice(0, limit);
  }

  async listExecutionsByAgent(
    agentId: string,
    limit = 20,
    offset = 0,
  ): Promise<MissionExecutionContext[]> {
    if (this.supabaseAdapter && this.supabaseAdapter.getTableReady() !== false) {
      const remote = await this.supabaseAdapter.listExecutionsByAgent(agentId, limit, offset);
      if (remote.length > 0) {
        this.lastHydratedAt = new Date().toISOString();
        return remote;
      }
    }

    return this.sessionAdapter
      .list()
      .filter((ctx) => ctx.assignedAgentId === agentId)
      .slice(offset, offset + limit);
  }

  async listExecutionEvents(executionId: string): Promise<MissionExecutionEventRecord[]> {
    if (this.supabaseAdapter && this.supabaseAdapter.getTableReady() !== false) {
      const remote = await this.supabaseAdapter.listExecutionEvents(executionId);
      if (remote.length > 0) return remote;
    }

    const context = this.sessionAdapter.load(executionId);
    if (!context) return [];

    return [
      buildMissionExecutionEventRecord({
        executionId,
        sequence: 1,
        eventType: `status:${context.status}`,
        status: context.status,
        progress: context.progress,
        step: context.currentStep,
        summary: context.resultSummary ?? context.sanitizedError,
      }),
    ];
  }

  async retryPendingSync(): Promise<{ attempted: number; succeeded: number; remaining: number }> {
    if (!this.supabaseAdapter) {
      return { attempted: 0, succeeded: 0, remaining: this.pendingQueue.count() };
    }

    const pending = this.pendingQueue.list().slice(0, MISSION_PERSISTENCE_PENDING_QUEUE_LIMIT);
    let succeeded = 0;

    for (const operation of pending) {
      if (operation.kind !== "save" || !operation.context) continue;
      const meta = operation.meta ?? this.resolveWriteMeta(operation.context);
      if (!meta?.createdByUserId) continue;

      const result = await this.supabaseAdapter.saveExecution(operation.context, meta);
      if (result.success) {
        succeeded += 1;
        this.pendingQueue.remove(operation.id);
      }
    }

    if (succeeded > 0) {
      this.lastSyncAt = new Date().toISOString();
      this.fallbackActive = this.pendingQueue.count() > 0;
      this.lastError = this.pendingQueue.count() > 0 ? "Sync parcial — fila pendente" : null;
    }

    this.notifyStatusChange();
    return {
      attempted: pending.length,
      succeeded,
      remaining: this.pendingQueue.count(),
    };
  }
}

export function createCompositeMissionExecutionPersistence(
  client: SupabaseClient | null,
  config: CompositeMissionExecutionPersistenceConfig,
): CompositeMissionExecutionPersistence {
  return new CompositeMissionExecutionPersistence(client, config);
}

export function isMissionExecutionPersistenceWithStatus(
  adapter: MissionExecutionPersistenceAdapter | undefined,
): adapter is MissionExecutionPersistenceAdapterWithStatus {
  return (
    adapter !== undefined &&
    typeof (adapter as MissionExecutionPersistenceAdapterWithStatus).getStatus === "function"
  );
}

export function readMissionExecutionPersistenceStatus(
  adapter: MissionExecutionPersistenceAdapter | undefined,
): MissionExecutionPersistenceHealth {
  if (isMissionExecutionPersistenceWithStatus(adapter)) {
    return adapter.getStatus();
  }
  return DEFAULT_MISSION_EXECUTION_PERSISTENCE_HEALTH;
}
