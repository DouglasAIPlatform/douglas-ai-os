export type {
  IManagedModule,
  IPluginManifestContract,
  ModuleLifecycleStatus,
  PlatformHealthStatus,
  PlatformStatusName,
  BootPhase,
  ShutdownPhase,
  RuntimePhase,
  ModuleHealthEntry,
  HealthReport,
  PlatformState,
  VersionInfo,
  DiagnosticEntry,
  BootResult,
  ShutdownResult,
  BootOptions,
} from "./DOSTypes";

export {
  DOS_TOPICS,
  PLATFORM_STATUS_LABELS,
  BOOT_PHASE_LABELS,
} from "./DOSTypes";

export type {
  IModuleRegistry,
  IModuleLoader,
  IModuleManager,
  IPluginValidator,
  IPluginRegistry,
  IHealthMonitor,
  IRuntime,
  IPlatformStatus,
  IDiagnostics,
  ILifecycleManager,
  IBootManager,
  IShutdownManager,
  IVersionManager,
  IEventPublisher,
  LifecycleEvent,
  IKernel,
  IOperatingSystem,
} from "./interfaces";

export { InMemoryModuleRegistry } from "./InMemoryModuleRegistry";
export { DefaultModuleLoader } from "./DefaultModuleLoader";
export { ModuleManager } from "./ModuleManager";
export {
  DefaultPluginValidator,
  InMemoryPluginRegistry,
} from "./DefaultPluginValidator";
export { HealthMonitor } from "./HealthMonitor";
export { Runtime } from "./Runtime";
export { PlatformStatus } from "./PlatformStatus";
export { Diagnostics } from "./Diagnostics";
export { LifecycleManager } from "./LifecycleManager";
export { BootManager, type BootManagerDependencies } from "./BootManager";
export { ShutdownManager, type ShutdownManagerDependencies } from "./ShutdownManager";
export {
  VersionManager,
  DOS_VERSION,
  KERNEL_VERSION,
} from "./VersionManager";
export { InMemoryEventPublisher } from "./InMemoryEventPublisher";
export { Kernel, type KernelOptions } from "./Kernel";
export {
  OperatingSystem,
  createOperatingSystem,
} from "./OperatingSystem";

export { DOSContext, type DOSContextValue } from "./DOSContext";
export { DOSProvider, type DOSProviderProps } from "./DOSProvider";
export { useDOS } from "./useDOS";
export { DOSStatusPanel } from "./DOSStatusPanel";
