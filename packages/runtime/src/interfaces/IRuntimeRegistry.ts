import type { RuntimeModuleDefinition, RuntimeModuleSnapshot } from "../RuntimeTypes";

export interface IRuntimeEventBus {
  publish(topic: string, source: string, payload: Record<string, unknown>): void;
  subscribe(
    topic: string,
    handler: (payload: Record<string, unknown>) => void,
  ): () => void;
}

export interface IRuntimeRegistry {
  registerAll(modules: RuntimeModuleDefinition[]): void;
  getModule(id: string): RuntimeModuleDefinition | undefined;
  getAllModules(): RuntimeModuleDefinition[];
  getSnapshot(id: string): RuntimeModuleSnapshot | undefined;
  getAllSnapshots(): RuntimeModuleSnapshot[];
  updateSnapshot(id: string, patch: Partial<RuntimeModuleSnapshot>): RuntimeModuleSnapshot;
}
