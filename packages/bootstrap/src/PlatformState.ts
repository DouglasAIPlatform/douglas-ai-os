import type {
  BootstrapHealthStatus,
  BootstrapModuleResult,
  BootstrapModuleSnapshot,
  GlobalPlatformState,
  PlatformBootStatus,
} from "./BootstrapTypes";

const INITIAL_STATE = (platformVersion: string): GlobalPlatformState => ({
  status: "offline",
  platformVersion,
  bootDurationMs: 0,
  modules: [],
  health: "degraded",
  readyModuleCount: 0,
  totalModuleCount: 0,
});

export class PlatformState {
  private state: GlobalPlatformState;

  constructor(platformVersion = "0.1.0") {
    this.state = INITIAL_STATE(platformVersion);
  }

  getState(): GlobalPlatformState {
    return { ...this.state, modules: [...this.state.modules] };
  }

  beginBoot(platformVersion: string): void {
    this.state = {
      ...INITIAL_STATE(platformVersion),
      status: "booting",
      bootStartedAt: new Date().toISOString(),
    };
  }

  applyModuleResult(result: BootstrapModuleResult): void {
    const snapshot: BootstrapModuleSnapshot = {
      ...result,
      loadedAt: new Date().toISOString(),
    };

    const modules = [...this.state.modules, snapshot];

    this.state = {
      ...this.state,
      modules,
      totalModuleCount: modules.length,
      readyModuleCount: modules.filter((module) => module.status === "ready").length,
    };
  }

  completeBoot(
    bootDurationMs: number,
    health: BootstrapHealthStatus,
    status: PlatformBootStatus,
  ): void {
    this.state = {
      ...this.state,
      status,
      bootDurationMs,
      bootCompletedAt: new Date().toISOString(),
      health,
      readyModuleCount: this.state.modules.filter((module) => module.status === "ready").length,
      totalModuleCount: this.state.modules.length,
    };
  }

  reset(platformVersion?: string): void {
    this.state = INITIAL_STATE(platformVersion ?? this.state.platformVersion);
  }
}
