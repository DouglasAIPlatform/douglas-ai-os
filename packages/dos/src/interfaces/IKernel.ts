import type { BootOptions, BootResult, HealthReport, PlatformState, ShutdownResult } from "../DOSTypes";
import type { IBootManager } from "./IBootManager";
import type { IDiagnostics } from "./IDiagnostics";
import type { IEventPublisher } from "./IEventPublisher";
import type { IHealthMonitor } from "./IHealthMonitor";
import type { ILifecycleManager } from "./ILifecycleManager";
import type { IModuleManager } from "./IModuleManager";
import type { IPlatformStatus } from "./IPlatformStatus";
import type { IPluginRegistry, IPluginValidator } from "./IPluginValidator";
import type { IRuntime } from "./IRuntime";
import type { IShutdownManager } from "./IShutdownManager";
import type { IVersionManager } from "./IVersionManager";

export interface IKernel {
  readonly moduleManager: IModuleManager;
  readonly pluginValidator: IPluginValidator;
  readonly pluginRegistry: IPluginRegistry;
  readonly healthMonitor: IHealthMonitor;
  readonly runtime: IRuntime;
  readonly platformStatus: IPlatformStatus;
  readonly diagnostics: IDiagnostics;
  readonly lifecycleManager: ILifecycleManager;
  readonly bootManager: IBootManager;
  readonly shutdownManager: IShutdownManager;
  readonly versionManager: IVersionManager;
  readonly eventPublisher: IEventPublisher;
}

export interface IOperatingSystem {
  readonly kernel: IKernel;
  boot(options: BootOptions): BootResult;
  shutdown(): ShutdownResult;
  getState(): PlatformState;
  getHealthReport(): HealthReport;
  isReady(): boolean;
}
