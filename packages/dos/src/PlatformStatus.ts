import type { PlatformState } from "./DOSTypes";
import type { IPlatformStatus } from "./interfaces/IPlatformStatus";

const INITIAL_STATE: PlatformState = {
  status: "offline",
  bootPhase: "idle",
  shutdownPhase: "idle",
  runtimePhase: "idle",
  health: "degraded",
  moduleCount: 0,
  readyModuleCount: 0,
  pluginCount: 0,
  validatedPluginCount: 0,
};

export class PlatformStatus implements IPlatformStatus {
  private state: PlatformState = { ...INITIAL_STATE };

  getState(): PlatformState {
    return { ...this.state };
  }

  setStatus(status: PlatformState["status"]): void {
    this.state = { ...this.state, status };
  }

  setBootPhase(phase: PlatformState["bootPhase"]): void {
    this.state = { ...this.state, bootPhase: phase };
  }

  setShutdownPhase(phase: PlatformState["shutdownPhase"]): void {
    this.state = { ...this.state, shutdownPhase: phase };
  }

  setHealth(health: PlatformState["health"], checkedAt?: string): void {
    this.state = {
      ...this.state,
      health,
      lastHealthCheckAt: checkedAt ?? new Date().toISOString(),
    };
  }

  updateCounts(
    partial: Partial<
      Pick<
        PlatformState,
        "moduleCount" | "readyModuleCount" | "pluginCount" | "validatedPluginCount"
      >
    >,
  ): void {
    this.state = { ...this.state, ...partial };
  }

  markBooted(): void {
    this.state = {
      ...this.state,
      bootedAt: new Date().toISOString(),
      status: this.state.health === "healthy" ? "ready" : "degraded",
      bootPhase: "complete",
      runtimePhase: "running",
    };
  }

  reset(): void {
    this.state = { ...INITIAL_STATE };
  }
}
