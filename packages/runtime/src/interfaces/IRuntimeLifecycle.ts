import type { RuntimeModuleStatus } from "../RuntimeTypes";

export interface IRuntimeLifecycle {
  canTransition(from: RuntimeModuleStatus, to: RuntimeModuleStatus): boolean;
  assertTransition(from: RuntimeModuleStatus, to: RuntimeModuleStatus): void;
}

export const RUNTIME_TRANSITIONS: Record<RuntimeModuleStatus, RuntimeModuleStatus[]> = {
  initializing: ["ready", "failed"],
  ready: ["paused", "restarting", "stopping", "failed"],
  paused: ["ready", "stopping", "failed"],
  restarting: ["ready", "failed"],
  stopping: ["stopped", "failed"],
  stopped: ["initializing", "failed"],
  failed: ["initializing", "restarting"],
};
