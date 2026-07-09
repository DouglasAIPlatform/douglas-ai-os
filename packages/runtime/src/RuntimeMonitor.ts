import type { RuntimeMonitorReport } from "./RuntimeTypes";
import type { IRuntimeMonitor } from "./interfaces/IRuntimeMonitor";
import type { IRuntimeRegistry } from "./interfaces/IRuntimeRegistry";
import { resolveRuntimeHealth } from "./RuntimeRegistry";

const DEFAULT_INTERVAL_MS = 5000;

export class RuntimeMonitor implements IRuntimeMonitor {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private active = false;

  constructor(private readonly intervalMs = DEFAULT_INTERVAL_MS) {}

  start(onTick: () => RuntimeMonitorReport): void {
    this.stop();
    this.active = true;
    this.intervalId = setInterval(() => {
      onTick();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  tick(registry: IRuntimeRegistry): RuntimeMonitorReport {
    const modules = registry.getAllSnapshots();
    const checkedAt = new Date().toISOString();

    const evaluated = modules.map((snapshot) => {
      const module = registry.getModule(snapshot.id);
      if (!module?.healthCheck || snapshot.status !== "ready") {
        return snapshot;
      }

      const health = module.healthCheck();
      if (health === snapshot.health) {
        return snapshot;
      }

      return registry.updateSnapshot(snapshot.id, { health });
    });

    const healthyCount = evaluated.filter((module) => module.health === "healthy").length;
    const degradedCount = evaluated.filter((module) => module.health === "degraded").length;
    const unhealthyCount = evaluated.filter((module) => module.health === "unhealthy").length;

    return {
      status: resolveRuntimeHealth(evaluated),
      healthyCount,
      degradedCount,
      unhealthyCount,
      modules: evaluated,
      checkedAt,
    };
  }
}
