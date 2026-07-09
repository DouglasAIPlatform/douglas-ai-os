import { BootManager } from "./BootManager";
import { DefaultModuleLoader } from "./DefaultModuleLoader";
import {
  DefaultPluginValidator,
  InMemoryPluginRegistry,
} from "./DefaultPluginValidator";
import { Diagnostics } from "./Diagnostics";
import { HealthMonitor } from "./HealthMonitor";
import { InMemoryEventPublisher } from "./InMemoryEventPublisher";
import { InMemoryModuleRegistry } from "./InMemoryModuleRegistry";
import { LifecycleManager } from "./LifecycleManager";
import { ModuleManager } from "./ModuleManager";
import { PlatformStatus } from "./PlatformStatus";
import { Runtime } from "./Runtime";
import { ShutdownManager } from "./ShutdownManager";
import { VersionManager } from "./VersionManager";
import type { IKernel } from "./interfaces/IKernel";
import type { IEventPublisher } from "./interfaces/IEventPublisher";
import type { IHealthMonitor } from "./interfaces/IHealthMonitor";
import type { IModuleRegistry } from "./interfaces/IModuleRegistry";
import type { IPluginRegistry, IPluginValidator } from "./interfaces/IPluginValidator";
import type { IVersionManager } from "./interfaces/IVersionManager";

export interface KernelOptions {
  moduleRegistry?: IModuleRegistry;
  pluginValidator?: IPluginValidator;
  pluginRegistry?: IPluginRegistry;
  healthMonitor?: IHealthMonitor;
  eventPublisher?: IEventPublisher;
  versionManager?: IVersionManager;
  platformVersion?: string;
  environment?: string;
}

export class Kernel implements IKernel {
  readonly moduleManager: ModuleManager;
  readonly pluginValidator: IPluginValidator;
  readonly pluginRegistry: IPluginRegistry;
  readonly healthMonitor: IHealthMonitor;
  readonly runtime: Runtime;
  readonly platformStatus: PlatformStatus;
  readonly diagnostics: Diagnostics;
  readonly lifecycleManager: LifecycleManager;
  readonly bootManager: BootManager;
  readonly shutdownManager: ShutdownManager;
  readonly versionManager: IVersionManager;
  readonly eventPublisher: IEventPublisher;

  constructor(options: KernelOptions = {}) {
    const moduleRegistry = options.moduleRegistry ?? new InMemoryModuleRegistry();
    this.lifecycleManager = new LifecycleManager();
    this.eventPublisher = options.eventPublisher ?? new InMemoryEventPublisher();
    this.pluginValidator = options.pluginValidator ?? new DefaultPluginValidator();
    this.pluginRegistry = options.pluginRegistry ?? new InMemoryPluginRegistry();
    this.healthMonitor = options.healthMonitor ?? new HealthMonitor();
    this.runtime = new Runtime();
    this.platformStatus = new PlatformStatus();
    this.diagnostics = new Diagnostics();
    this.versionManager = options.versionManager ?? new VersionManager();

    if (options.platformVersion) {
      this.versionManager.setPlatformVersion(options.platformVersion);
    }

    if (options.environment) {
      this.versionManager.setEnvironment(options.environment);
    }

    const loader = new DefaultModuleLoader(
      moduleRegistry,
      this.lifecycleManager,
      this.eventPublisher,
    );

    this.moduleManager = new ModuleManager(moduleRegistry, loader);

    this.bootManager = new BootManager({
      moduleManager: this.moduleManager,
      pluginValidator: this.pluginValidator,
      pluginRegistry: this.pluginRegistry,
      healthMonitor: this.healthMonitor,
      runtime: this.runtime,
      platformStatus: this.platformStatus,
      diagnostics: this.diagnostics,
      eventPublisher: this.eventPublisher,
    });

    this.shutdownManager = new ShutdownManager({
      moduleManager: this.moduleManager,
      lifecycleManager: this.lifecycleManager,
      runtime: this.runtime,
      platformStatus: this.platformStatus,
      diagnostics: this.diagnostics,
      eventPublisher: this.eventPublisher,
    });
  }
}
