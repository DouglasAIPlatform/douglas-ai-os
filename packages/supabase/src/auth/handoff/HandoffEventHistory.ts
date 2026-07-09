import type { HandoffEventKey } from "./HandoffEventKey";
import type { HandoffRelevantTransition } from "./HandoffEventPolicy";

export interface HandoffEventHistoryOptions {
  maxKeys?: number;
}

/** Histórico in-memory de chaves emitidas e última transição relevante. */
export class HandoffEventHistory {
  private readonly maxKeys: number;
  private readonly emittedKeys = new Set<HandoffEventKey>();
  private keyOrder: HandoffEventKey[] = [];
  private lastRelevantTransition: HandoffRelevantTransition | null = null;

  constructor(options: HandoffEventHistoryOptions = {}) {
    this.maxKeys = options.maxKeys ?? 100;
  }

  has(key: HandoffEventKey): boolean {
    return this.emittedKeys.has(key);
  }

  record(key: HandoffEventKey): void {
    if (this.emittedKeys.has(key)) {
      return;
    }

    this.emittedKeys.add(key);
    this.keyOrder.push(key);

    while (this.keyOrder.length > this.maxKeys) {
      const oldest = this.keyOrder.shift();
      if (oldest) {
        this.emittedKeys.delete(oldest);
      }
    }
  }

  setLastRelevantTransition(transition: HandoffRelevantTransition | null): void {
    this.lastRelevantTransition = transition;
  }

  getLastRelevantTransition(): HandoffRelevantTransition | null {
    return this.lastRelevantTransition;
  }

  clear(): void {
    this.emittedKeys.clear();
    this.keyOrder = [];
    this.lastRelevantTransition = null;
  }
}
