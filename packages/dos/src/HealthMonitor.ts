import type {
  ModuleHealthEntry,
  ModuleLifecycleStatus,
  PlatformHealthStatus,
  HealthReport,
} from "./DOSTypes";
import type { IHealthMonitor } from "./interfaces/IHealthMonitor";
import type { IModuleRegistry } from "./interfaces/IModuleRegistry";

function mapModuleHealth(status: ModuleLifecycleStatus): PlatformHealthStatus {
  if (status === "ready" || status === "loaded") return "healthy";
  if (status === "loading" || status === "registered" || status === "stopping") {
    return "degraded";
  }
  if (status === "error" || status === "disabled") return "unhealthy";
  return "degraded";
}

export class HealthMonitor implements IHealthMonitor {
  run(registry: IModuleRegistry): HealthReport {
    const modules: ModuleHealthEntry[] = registry.getAll().map((module) => {
      const health = mapModuleHealth(module.status);

      return {
        moduleId: module.id,
        status: module.status,
        health,
        message: `Module ${module.name} is ${module.status}.`,
      };
    });

    return {
      status: this.resolveOverallStatus(modules),
      modules,
      checkedAt: new Date().toISOString(),
    };
  }

  private resolveOverallStatus(modules: ModuleHealthEntry[]): PlatformHealthStatus {
    if (modules.some((module) => module.health === "unhealthy")) {
      return "unhealthy";
    }

    if (modules.some((module) => module.health === "degraded")) {
      return "degraded";
    }

    return "healthy";
  }
}
