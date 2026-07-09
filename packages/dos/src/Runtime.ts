import type { PlatformState, RuntimePhase } from "./DOSTypes";
import type { IRuntime } from "./interfaces/IRuntime";

export class Runtime implements IRuntime {
  private phase: RuntimePhase = "idle";
  private bootedAt?: number;

  getPhase(): RuntimePhase {
    return this.phase;
  }

  setPhase(phase: RuntimePhase): void {
    this.phase = phase;
  }

  isRunning(): boolean {
    return this.phase === "running";
  }

  markBooted(): void {
    this.bootedAt = Date.now();
    this.phase = "running";
  }

  markStopped(): void {
    this.phase = "stopped";
  }

  getUptimeMs(): number {
    if (!this.bootedAt) return 0;
    return Date.now() - this.bootedAt;
  }

  snapshot(state: Omit<PlatformState, "runtimePhase">): PlatformState {
    return {
      ...state,
      runtimePhase: this.phase,
    };
  }
}
