import type { MissionExecutionContext } from "../MissionExecutionTypes";
import type { MissionExecutionPersistenceWriteMeta } from "./SupabaseMissionExecutionMapper";

export interface MissionExecutionPendingOperation {
  id: string;
  kind: "save" | "event";
  executionId: string;
  context?: MissionExecutionContext;
  meta?: MissionExecutionPersistenceWriteMeta;
  eventPayload?: string;
  attempts: number;
  lastError?: string;
  enqueuedAt: string;
}

export const MISSION_PERSISTENCE_PENDING_QUEUE_LIMIT = 50;

export class MissionExecutionPendingQueue {
  private readonly storageKey: string;
  private queue: MissionExecutionPendingOperation[] = [];

  constructor(storageKey = "douglas:mission-execution-pending") {
    this.storageKey = storageKey;
    this.hydrate();
  }

  hydrate(): void {
    if (typeof globalThis.sessionStorage === "undefined") {
      this.queue = [];
      return;
    }
    try {
      const raw = globalThis.sessionStorage.getItem(this.storageKey);
      this.queue = raw ? (JSON.parse(raw) as MissionExecutionPendingOperation[]) : [];
    } catch {
      this.queue = [];
    }
  }

  private persist(): void {
    if (typeof globalThis.sessionStorage === "undefined") return;
    try {
      globalThis.sessionStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch {
      // storage cheio — descarta operações mais antigas
      this.queue = this.queue.slice(-Math.floor(MISSION_PERSISTENCE_PENDING_QUEUE_LIMIT / 2));
    }
  }

  count(): number {
    return this.queue.length;
  }

  enqueue(operation: MissionExecutionPendingOperation): boolean {
    if (this.queue.length >= MISSION_PERSISTENCE_PENDING_QUEUE_LIMIT) {
      this.queue.shift();
    }
    this.queue.push(operation);
    this.persist();
    return true;
  }

  list(): MissionExecutionPendingOperation[] {
    return [...this.queue];
  }

  remove(id: string): void {
    this.queue = this.queue.filter((item) => item.id !== id);
    this.persist();
  }

  clear(): void {
    this.queue = [];
    this.persist();
  }
}
