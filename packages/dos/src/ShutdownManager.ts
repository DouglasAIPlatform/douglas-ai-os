import type { ShutdownPhase, ShutdownResult } from "./DOSTypes";
import { DOS_TOPICS } from "./DOSTypes";
import type { IShutdownManager } from "./interfaces/IShutdownManager";
import type { IDiagnostics } from "./interfaces/IDiagnostics";
import type { IEventPublisher } from "./interfaces/IEventPublisher";
import type { ILifecycleManager } from "./interfaces/ILifecycleManager";
import type { IModuleManager } from "./interfaces/IModuleManager";
import type { IPlatformStatus } from "./interfaces/IPlatformStatus";
import type { IRuntime } from "./interfaces/IRuntime";

export interface ShutdownManagerDependencies {
  moduleManager: IModuleManager;
  lifecycleManager: ILifecycleManager;
  runtime: IRuntime;
  platformStatus: IPlatformStatus;
  diagnostics: IDiagnostics;
  eventPublisher: IEventPublisher;
}

export class ShutdownManager implements IShutdownManager {
  private lastResult: ShutdownResult | null = null;

  constructor(private readonly deps: ShutdownManagerDependencies) {}

  shutdown(): ShutdownResult {
    const diagnostics = [];

    this.deps.platformStatus.setStatus("shutting_down");
    this.deps.runtime.setPhase("shutting_down");
    this.deps.eventPublisher.publish(DOS_TOPICS.SHUTDOWN_STARTED);

    let phase: ShutdownPhase = "stopping_modules";
    this.deps.platformStatus.setShutdownPhase(phase);

    const modules = [...this.deps.moduleManager.getAllModules()].reverse();

    modules.forEach((module) => {
      if (module.status !== "ready" && module.status !== "loaded") return;

      try {
        const stopping = this.deps.lifecycleManager.transition(module, "stopping");
        this.deps.moduleManager.updateStatus(module.id, stopping.status);

        const stopped = this.deps.lifecycleManager.transition(stopping, "stopped");
        this.deps.moduleManager.updateStatus(module.id, stopped.status);
      } catch (error) {
        diagnostics.push(
          this.deps.diagnostics.record({
            level: "warn",
            source: "ShutdownManager",
            message:
              error instanceof Error
                ? error.message
                : `Failed to stop module ${module.id}.`,
          }),
        );
      }
    });

    phase = "cleanup";
    this.deps.platformStatus.setShutdownPhase(phase);
    this.deps.runtime.markStopped();

    phase = "complete";
    this.deps.platformStatus.setShutdownPhase(phase);
    this.deps.platformStatus.setStatus("offline");
    this.deps.eventPublisher.publish(DOS_TOPICS.SHUTDOWN_COMPLETE);

    diagnostics.push(
      this.deps.diagnostics.record({
        level: "info",
        source: "ShutdownManager",
        message: "Douglas Operating System shutdown complete.",
      }),
    );

    this.lastResult = { success: true, phase, diagnostics };
    return this.lastResult;
  }

  getLastResult(): ShutdownResult | null {
    return this.lastResult;
  }
}
