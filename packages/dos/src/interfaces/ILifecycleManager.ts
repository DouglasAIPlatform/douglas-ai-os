import type { IManagedModule, ModuleLifecycleStatus } from "../DOSTypes";

export interface ILifecycleManager {
  transition(
    module: IManagedModule,
    nextStatus: ModuleLifecycleStatus,
  ): IManagedModule;
  canTransition(
    current: ModuleLifecycleStatus,
    next: ModuleLifecycleStatus,
  ): boolean;
  getAllowedTransitions(status: ModuleLifecycleStatus): ModuleLifecycleStatus[];
}
