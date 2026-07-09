import type { PlatformState } from "../DOSTypes";

export interface IPlatformStatus {
  getState(): PlatformState;
  setStatus(status: PlatformState["status"]): void;
  setBootPhase(phase: PlatformState["bootPhase"]): void;
  setShutdownPhase(phase: PlatformState["shutdownPhase"]): void;
  setHealth(health: PlatformState["health"], checkedAt?: string): void;
  updateCounts(partial: Partial<Pick<PlatformState, "moduleCount" | "readyModuleCount" | "pluginCount" | "validatedPluginCount">>): void;
  markBooted(): void;
  reset(): void;
}
