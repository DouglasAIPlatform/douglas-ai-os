import type {
  BootstrapOptions,
  GlobalPlatformState,
  StartupReport,
  SystemHealthReport,
} from "./BootstrapTypes";
import type { IBootstrapManager } from "./interfaces/IBootstrapManager";
import type { IBootstrapModuleLoader } from "./interfaces/IBootstrapModuleLoader";
import { ModuleLoader } from "./ModuleLoader";
import { PlatformState } from "./PlatformState";
import { StartupReportBuilder } from "./StartupReport";
import { SystemHealth, resolvePlatformBootStatus } from "./SystemHealth";

export interface BootstrapManagerOptions {
  loader?: IBootstrapModuleLoader;
  platformState?: PlatformState;
  systemHealth?: SystemHealth;
}

export class BootstrapManager implements IBootstrapManager {
  private readonly loader: IBootstrapModuleLoader;
  private readonly platformState: PlatformState;
  private readonly systemHealth: SystemHealth;
  private startupReport: StartupReport | null = null;

  constructor(options: BootstrapManagerOptions = {}) {
    this.loader = options.loader ?? new ModuleLoader();
    this.platformState = options.platformState ?? new PlatformState();
    this.systemHealth = options.systemHealth ?? new SystemHealth();
  }

  async boot(options: BootstrapOptions): Promise<StartupReport> {
    const bootStart =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    this.platformState.beginBoot(options.platformVersion);

    const results = await this.loader.loadAll(options.modules);

    results.forEach((result) => {
      this.platformState.applyModuleResult(result);
    });

    const bootDurationMs = Math.round(
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - bootStart,
    );

    const snapshots = this.platformState.getState().modules;
    const health = this.systemHealth.evaluate(snapshots);
    const failedCount = results.filter((module) => module.status === "failed").length;
    const platformStatus = resolvePlatformBootStatus(health.status, failedCount);

    this.platformState.completeBoot(bootDurationMs, health.status, platformStatus);

    this.startupReport = new StartupReportBuilder().build(
      options.platformVersion,
      bootDurationMs,
      results,
      health,
    );

    return this.startupReport;
  }

  getState(): GlobalPlatformState {
    return this.platformState.getState();
  }

  getHealth(): SystemHealthReport {
    return this.systemHealth.evaluate(this.platformState.getState().modules);
  }

  getStartupReport(): StartupReport | null {
    return this.startupReport;
  }

  isReady(): boolean {
    const state = this.getState();
    return state.status === "ready" || state.status === "degraded";
  }
}
