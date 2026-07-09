import type { BootOptions, BootResult, BootPhase, DiagnosticEntry } from "./DOSTypes";
import { DOS_TOPICS } from "./DOSTypes";
import type { IBootManager } from "./interfaces/IBootManager";
import type { IDiagnostics } from "./interfaces/IDiagnostics";
import type { IEventPublisher } from "./interfaces/IEventPublisher";
import type { IHealthMonitor } from "./interfaces/IHealthMonitor";
import type { IModuleManager } from "./interfaces/IModuleManager";
import type { IPlatformStatus } from "./interfaces/IPlatformStatus";
import type { IPluginRegistry, IPluginValidator } from "./interfaces/IPluginValidator";
import type { IRuntime } from "./interfaces/IRuntime";

export interface BootManagerDependencies {
  moduleManager: IModuleManager;
  pluginValidator: IPluginValidator;
  pluginRegistry: IPluginRegistry;
  healthMonitor: IHealthMonitor;
  runtime: IRuntime;
  platformStatus: IPlatformStatus;
  diagnostics: IDiagnostics;
  eventPublisher: IEventPublisher;
}

export class BootManager implements IBootManager {
  private lastResult: BootResult | null = null;

  constructor(private readonly deps: BootManagerDependencies) {}

  boot(options: BootOptions): BootResult {
    const diagnostics: DiagnosticEntry[] = [];
    const pluginErrors: string[] = [];
    const moduleErrors: string[] = [];

    this.deps.platformStatus.reset();
    this.deps.pluginRegistry.clear();
    this.deps.moduleManager.getRegistry().clear();
    this.deps.runtime.setPhase("booting");
    this.deps.platformStatus.setStatus("booting");
    this.deps.eventPublisher.publish(DOS_TOPICS.BOOT_STARTED);

    let phase: BootPhase = "validating_plugins";
    this.deps.platformStatus.setBootPhase(phase);

    const plugins = options.plugins ?? [];
    this.deps.platformStatus.updateCounts({ pluginCount: plugins.length });

    plugins.forEach((manifest) => {
      const errors = this.deps.pluginValidator.validate(manifest);

      if (errors.length) {
        this.deps.pluginRegistry.recordRejection(manifest, errors);
        pluginErrors.push(...errors.map((error) => `[${manifest.id}] ${error}`));
        this.deps.eventPublisher.publish(DOS_TOPICS.PLUGIN_REJECTED, {
          pluginId: manifest.id,
        });
        diagnostics.push(
          this.deps.diagnostics.record({
            level: "error",
            source: "BootManager",
            message: `Plugin rejected: ${manifest.id}`,
            metadata: { errors: errors.join("; ") },
          }),
        );
        return;
      }

      this.deps.pluginRegistry.register(manifest);
      this.deps.eventPublisher.publish(DOS_TOPICS.PLUGIN_VALIDATED, {
        pluginId: manifest.id,
      });
    });

    this.deps.platformStatus.updateCounts({
      validatedPluginCount: this.deps.pluginRegistry.getValidated().length,
    });

    phase = "loading_modules";
    this.deps.platformStatus.setBootPhase(phase);
    this.deps.moduleManager.register(options.modules);
    this.deps.platformStatus.updateCounts({ moduleCount: options.modules.length });

    try {
      const loaded = this.deps.moduleManager.loadAll();
      this.deps.platformStatus.updateCounts({ readyModuleCount: loaded.length });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown module load error.";
      moduleErrors.push(message);
      diagnostics.push(
        this.deps.diagnostics.record({
          level: "error",
          source: "BootManager",
          message,
        }),
      );
    }

    phase = "initializing_runtime";
    this.deps.platformStatus.setBootPhase(phase);
    this.deps.runtime.markBooted();

    phase = "running_health_check";
    this.deps.platformStatus.setBootPhase(phase);
    const health = this.deps.healthMonitor.run(this.deps.moduleManager.getRegistry());
    this.deps.platformStatus.setHealth(health.status, health.checkedAt);
    this.deps.eventPublisher.publish(DOS_TOPICS.HEALTH_CHECK, {
      status: health.status,
    });

    const success = moduleErrors.length === 0 && health.status !== "unhealthy";
    phase = success ? "complete" : "failed";
    this.deps.platformStatus.setBootPhase(phase);

    if (success) {
      this.deps.platformStatus.markBooted();
      this.deps.eventPublisher.publish(DOS_TOPICS.PLATFORM_READY);
      this.deps.eventPublisher.publish(DOS_TOPICS.BOOT_COMPLETE);
      diagnostics.push(
        this.deps.diagnostics.record({
          level: "info",
          source: "BootManager",
          message: "Douglas Operating System boot complete.",
        }),
      );
    } else {
      this.deps.platformStatus.setStatus("error");
      this.deps.runtime.setPhase("idle");
      this.deps.eventPublisher.publish(DOS_TOPICS.BOOT_FAILED);
      diagnostics.push(
        this.deps.diagnostics.record({
          level: "error",
          source: "BootManager",
          message: "Douglas Operating System boot failed.",
        }),
      );
    }

    this.lastResult = {
      success,
      phase,
      health,
      pluginErrors,
      moduleErrors,
      diagnostics,
    };

    return this.lastResult;
  }

  getLastResult(): BootResult | null {
    return this.lastResult;
  }
}
