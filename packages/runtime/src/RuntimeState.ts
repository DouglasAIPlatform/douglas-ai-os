import type {
  GlobalRuntimeState,
  PlatformRuntimeStatus,
  RuntimeHealthStatus,
  RuntimeModuleSnapshot,
} from "./RuntimeTypes";

export class RuntimeState {
  private state: GlobalRuntimeState = {
    status: "offline",
    platformVersion: "",
    uptimeMs: 0,
    modules: [],
    health: "healthy",
    readyModuleCount: 0,
    totalModuleCount: 0,
  };

  private runtimeStartedAt: number | null = null;

  beginStart(platformVersion: string, moduleCount: number): void {
    this.runtimeStartedAt =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    this.state = {
      status: "starting",
      platformVersion,
      startedAt: new Date().toISOString(),
      uptimeMs: 0,
      modules: [],
      health: "healthy",
      readyModuleCount: 0,
      totalModuleCount: moduleCount,
    };
  }

  applyModuleSnapshot(snapshot: RuntimeModuleSnapshot): void {
    const modules = [...this.state.modules];
    const index = modules.findIndex((module) => module.id === snapshot.id);

    if (index >= 0) {
      modules[index] = snapshot;
    } else {
      modules.push(snapshot);
    }

    const readyModuleCount = modules.filter((module) => module.status === "ready").length;

    this.state = {
      ...this.state,
      modules,
      readyModuleCount,
      totalModuleCount: Math.max(this.state.totalModuleCount, modules.length),
    };
  }

  completeStart(health: RuntimeHealthStatus, status: PlatformRuntimeStatus = "running"): void {
    this.state = {
      ...this.state,
      status,
      health,
      uptimeMs: this.computeUptimeMs(),
    };
  }

  beginStop(): void {
    this.state = {
      ...this.state,
      status: "stopping",
    };
  }

  completeStop(health: RuntimeHealthStatus): void {
    this.runtimeStartedAt = null;
    this.state = {
      ...this.state,
      status: "stopped",
      health,
      stoppedAt: new Date().toISOString(),
      uptimeMs: 0,
    };
  }

  setPlatformStatus(status: PlatformRuntimeStatus): void {
    this.state = { ...this.state, status };
  }

  setHealth(health: RuntimeHealthStatus): void {
    this.state = { ...this.state, health };
  }

  setMonitorCheckAt(iso: string): void {
    this.state = { ...this.state, lastMonitorCheckAt: iso };
  }

  refreshUptime(): void {
    if (this.runtimeStartedAt === null || this.state.status !== "running") return;
    this.state = {
      ...this.state,
      uptimeMs: this.computeUptimeMs(),
    };
  }

  getState(): GlobalRuntimeState {
    this.refreshUptime();
    return {
      ...this.state,
      modules: [...this.state.modules],
    };
  }

  reset(): void {
    this.runtimeStartedAt = null;
    this.state = {
      status: "offline",
      platformVersion: "",
      uptimeMs: 0,
      modules: [],
      health: "healthy",
      readyModuleCount: 0,
      totalModuleCount: 0,
    };
  }

  private computeUptimeMs(): number {
    if (this.runtimeStartedAt === null) return 0;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    return Math.round(now - this.runtimeStartedAt);
  }
}
