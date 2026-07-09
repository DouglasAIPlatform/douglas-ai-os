import type { PlatformState, RuntimePhase } from "../DOSTypes";

export interface IRuntime {
  getPhase(): RuntimePhase;
  setPhase(phase: RuntimePhase): void;
  isRunning(): boolean;
  markBooted(): void;
  markStopped(): void;
  getUptimeMs(): number;
  snapshot(state: Omit<PlatformState, "runtimePhase">): PlatformState;
}
