import type { ModuleRegistry } from "./ModuleRegistry";
import type {
  CoreHealthReport,
  CoreHealthStatus,
  CoreModuleHealth,
  CoreModuleStatus,
} from "./CoreTypes";

function mapModuleHealth(status: CoreModuleStatus): CoreHealthStatus {
  if (status === "ready" || status === "loaded") return "healthy";
  if (status === "loading" || status === "registered") return "degraded";
  if (status === "error" || status === "disabled") return "unhealthy";
  return "degraded";
}

export class HealthCheck {
  constructor(private readonly registry: ModuleRegistry) {}

  run(): CoreHealthReport {
    const modules: CoreModuleHealth[] = this.registry.getAll().map((module) => {
      const health = mapModuleHealth(module.status);

      return {
        moduleId: module.id,
        status: module.status,
        health,
        message: `Module ${module.name} is ${module.status}.`,
      };
    });

    const status = this.resolveOverallStatus(modules);

    return {
      status,
      modules,
      checkedAt: new Date().toISOString(),
    };
  }

  private resolveOverallStatus(modules: CoreModuleHealth[]): CoreHealthStatus {
    if (modules.some((module) => module.health === "unhealthy")) {
      return "unhealthy";
    }

    if (modules.some((module) => module.health === "degraded")) {
      return "degraded";
    }

    return "healthy";
  }
}
