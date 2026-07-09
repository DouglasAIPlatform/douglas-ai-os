import type {
  GlobalRuntimeState,
  RuntimeModuleInitContext,
  RuntimeModuleStatus,
  RuntimeMonitorReport,
  RuntimeShutdownReport,
  RuntimeStartOptions,
} from "./RuntimeTypes";
import type { IRuntimeEventBus } from "./interfaces/IRuntimeEventBus";
import type { IRuntimeLifecycle } from "./interfaces/IRuntimeLifecycle";
import type { IRuntimeManager } from "./interfaces/IRuntimeManager";
import type { IRuntimeMonitor } from "./interfaces/IRuntimeMonitor";
import type { IRuntimeRegistry } from "./interfaces/IRuntimeRegistry";
import { RuntimeLifecycle } from "./RuntimeLifecycle";
import { RuntimeMonitor } from "./RuntimeMonitor";
import { RuntimeRegistry, resolveRuntimeHealth } from "./RuntimeRegistry";
import { RuntimeState } from "./RuntimeState";

export interface RuntimeManagerOptions {
  registry?: IRuntimeRegistry;
  lifecycle?: IRuntimeLifecycle;
  monitor?: IRuntimeMonitor;
  runtimeState?: RuntimeState;
  eventBus?: IRuntimeEventBus;
}

export class RuntimeManager implements IRuntimeManager {
  private readonly registry: IRuntimeRegistry;
  private readonly lifecycle: IRuntimeLifecycle;
  private readonly monitor: IRuntimeMonitor;
  private readonly runtimeState: RuntimeState;
  private readonly eventBus: IRuntimeEventBus | null;
  private platformVersion = "";

  constructor(options: RuntimeManagerOptions = {}) {
    this.registry = options.registry ?? new RuntimeRegistry();
    this.lifecycle = options.lifecycle ?? new RuntimeLifecycle();
    this.monitor = options.monitor ?? new RuntimeMonitor();
    this.runtimeState = options.runtimeState ?? new RuntimeState();
    this.eventBus = options.eventBus ?? null;
  }

  async start(options: RuntimeStartOptions): Promise<void> {
    this.platformVersion = options.platformVersion;
    this.registry.registerAll(options.modules);
    this.runtimeState.beginStart(options.platformVersion, options.modules.length);

    for (const module of options.modules) {
      await this.activateModule(module.id);
    }

    const snapshots = this.registry.getAllSnapshots();
    const health = resolveRuntimeHealth(snapshots);
    this.runtimeState.completeStart(health, "running");

    this.eventBus?.publish("system:platform:ready", "runtime", {
      platformVersion: options.platformVersion,
      moduleCount: options.modules.length,
    });

    this.monitor.start(() => {
      const report = this.monitor.tick(this.registry);
      report.modules.forEach((snapshot) => {
        this.runtimeState.applyModuleSnapshot(snapshot);
      });
      this.runtimeState.setHealth(report.status);
      this.runtimeState.setMonitorCheckAt(report.checkedAt);
      return report;
    });
  }

  async stop(): Promise<RuntimeShutdownReport> {
    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    this.monitor.stop();
    this.runtimeState.beginStop();

    const modules = [...this.registry.getAllModules()].reverse();
    let failedCount = 0;

    for (const module of modules) {
      try {
        await this.transitionModuleInternal(module.id, "stopping");
        if (module.stop) {
          await module.stop();
        }
        this.registry.updateSnapshot(module.id, {
          status: "stopped",
          message: "Module stopped",
        });
      } catch (error) {
        failedCount += 1;
        this.registry.updateSnapshot(module.id, {
          status: "failed",
          health: "unhealthy",
          message: error instanceof Error ? error.message : "Stop failed",
        });
      }
    }

    const snapshots = this.registry.getAllSnapshots();
    const health = resolveRuntimeHealth(snapshots);
    this.runtimeState.completeStop(health);

    const durationMs = Math.round(
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - start,
    );

    return {
      success: failedCount === 0,
      platformVersion: this.platformVersion,
      shutdownDurationMs: durationMs,
      stoppedCount: snapshots.filter((module) => module.status === "stopped").length,
      failedCount,
      modules: snapshots,
      generatedAt: new Date().toISOString(),
    };
  }

  async pauseModule(moduleId: string): Promise<void> {
    const module = this.registry.getModule(moduleId);
    if (!module) throw new Error(`Runtime module not found: ${moduleId}`);

    await this.transitionModuleInternal(moduleId, "paused");
    if (module.pause) {
      await module.pause();
    }
    this.registry.updateSnapshot(moduleId, {
      status: "paused",
      message: "Module paused",
    });
    this.syncPlatformHealth();
  }

  async resumeModule(moduleId: string): Promise<void> {
    const module = this.registry.getModule(moduleId);
    if (!module) throw new Error(`Runtime module not found: ${moduleId}`);

    await this.transitionModuleInternal(moduleId, "ready");
    if (module.resume) {
      await module.resume();
    }
    this.registry.updateSnapshot(moduleId, {
      status: "ready",
      message: "Module resumed",
    });
    this.syncPlatformHealth();
  }

  async restartModule(moduleId: string): Promise<void> {
    const module = this.registry.getModule(moduleId);
    if (!module) throw new Error(`Runtime module not found: ${moduleId}`);

    await this.transitionModuleInternal(moduleId, "restarting");
    this.registry.updateSnapshot(moduleId, {
      status: "restarting",
      message: "Module restarting",
    });

    if (module.stop) {
      await module.stop();
    }
    if (module.restart) {
      await module.restart();
    }

    await this.activateModule(moduleId);
    this.syncPlatformHealth();
  }

  async refreshModule(moduleId: string): Promise<void> {
    const module = this.registry.getModule(moduleId);
    const snapshot = this.registry.getSnapshot(moduleId);
    if (!module || !snapshot) throw new Error(`Runtime module not found: ${moduleId}`);

    const health = module.healthCheck?.() ?? snapshot.health;
    const updated = this.registry.updateSnapshot(moduleId, {
      health,
      message: "Module refreshed (simulated)",
    });
    this.runtimeState.applyModuleSnapshot(updated);
    this.syncPlatformHealth();
  }

  async runHealthCheck(moduleId: string): Promise<import("./RuntimeTypes").RuntimeHealthStatus> {
    const module = this.registry.getModule(moduleId);
    const snapshot = this.registry.getSnapshot(moduleId);
    if (!module || !snapshot) throw new Error(`Runtime module not found: ${moduleId}`);

    const health = module.healthCheck?.() ?? snapshot.health;
    const updated = this.registry.updateSnapshot(moduleId, {
      health,
      message: `Health check: ${health}`,
    });
    this.runtimeState.applyModuleSnapshot(updated);
    this.syncPlatformHealth();
    return health;
  }

  transitionModule(moduleId: string, status: RuntimeModuleStatus, message?: string): void {
    const snapshot = this.registry.getSnapshot(moduleId);
    if (!snapshot) throw new Error(`Runtime module not found: ${moduleId}`);

    this.lifecycle.assertTransition(snapshot.status, status);
    const updated = this.registry.updateSnapshot(moduleId, { status, message });
    this.runtimeState.applyModuleSnapshot(updated);
    this.syncPlatformHealth();
  }

  getState(): GlobalRuntimeState {
    const snapshots = this.registry.getAllSnapshots();
    snapshots.forEach((snapshot) => {
      this.runtimeState.applyModuleSnapshot(snapshot);
    });
    return this.runtimeState.getState();
  }

  getMonitorReport(): RuntimeMonitorReport {
    return this.monitor.tick(this.registry);
  }

  isRunning(): boolean {
    return this.runtimeState.getState().status === "running";
  }

  private async activateModule(moduleId: string): Promise<void> {
    const module = this.registry.getModule(moduleId);
    if (!module) return;

    const current = this.registry.getSnapshot(moduleId);
    const fromStatus = current?.status ?? "stopped";

    if (fromStatus !== "initializing") {
      this.lifecycle.assertTransition(fromStatus, "initializing");
    }

    this.registry.updateSnapshot(moduleId, {
      status: "initializing",
      message: "Initializing module",
    });

    const context = this.createModuleContext(moduleId);

    try {
      await module.initialize(context);
      if (module.start) {
        await module.start();
      }

      const ready = this.registry.updateSnapshot(moduleId, {
        status: "ready",
        health: module.healthCheck?.() ?? "healthy",
        message: "Module ready",
      });

      this.runtimeState.applyModuleSnapshot(ready);

      this.eventBus?.publish("internal:module:ready", moduleId, {
        moduleId,
      });
    } catch (error) {
      const failed = this.registry.updateSnapshot(moduleId, {
        status: "failed",
        health: "unhealthy",
        message: error instanceof Error ? error.message : "Activation failed",
      });
      this.runtimeState.applyModuleSnapshot(failed);
    }
  }

  private createModuleContext(moduleId: string): RuntimeModuleInitContext {
    return {
      moduleId,
      publish: (topic, payload) => {
        this.eventBus?.publish(topic, moduleId, payload);
      },
      subscribe: (topic, handler) => {
        if (!this.eventBus) {
          return () => undefined;
        }
        return this.eventBus.subscribe(topic, handler);
      },
    };
  }

  private async transitionModuleInternal(
    moduleId: string,
    to: RuntimeModuleStatus,
  ): Promise<void> {
    const snapshot = this.registry.getSnapshot(moduleId);
    if (!snapshot) throw new Error(`Runtime module not found: ${moduleId}`);
    this.lifecycle.assertTransition(snapshot.status, to);
  }

  private syncPlatformHealth(): void {
    const health = resolveRuntimeHealth(this.registry.getAllSnapshots());
    this.runtimeState.setHealth(health);
  }
}
