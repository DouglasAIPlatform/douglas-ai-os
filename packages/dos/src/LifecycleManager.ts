import type { IManagedModule, ModuleLifecycleStatus } from "./DOSTypes";
import type { ILifecycleManager } from "./interfaces/ILifecycleManager";

const TRANSITIONS: Record<ModuleLifecycleStatus, ModuleLifecycleStatus[]> = {
  registered: ["loading", "disabled", "error"],
  loading: ["loaded", "error"],
  loaded: ["ready", "error"],
  ready: ["stopping", "disabled", "error"],
  stopping: ["stopped", "error"],
  stopped: ["registered"],
  disabled: ["registered"],
  error: ["registered"],
};

export class LifecycleManager implements ILifecycleManager {
  transition(
    module: IManagedModule,
    nextStatus: ModuleLifecycleStatus,
  ): IManagedModule {
    if (!this.canTransition(module.status, nextStatus)) {
      throw new Error(
        `Invalid lifecycle transition for ${module.id}: ${module.status} → ${nextStatus}`,
      );
    }

    return { ...module, status: nextStatus };
  }

  canTransition(current: ModuleLifecycleStatus, next: ModuleLifecycleStatus): boolean {
    return TRANSITIONS[current]?.includes(next) ?? false;
  }

  getAllowedTransitions(status: ModuleLifecycleStatus): ModuleLifecycleStatus[] {
    return TRANSITIONS[status] ?? [];
  }
}
