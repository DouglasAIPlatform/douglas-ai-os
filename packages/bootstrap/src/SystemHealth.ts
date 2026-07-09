import type {
  BootstrapHealthStatus,
  BootstrapModuleSnapshot,
  SystemHealthReport,
} from "./BootstrapTypes";

function resolveOverallStatus(
  modules: BootstrapModuleSnapshot[],
): BootstrapHealthStatus {
  if (modules.some((module) => module.health === "unhealthy")) return "unhealthy";
  if (modules.some((module) => module.health === "degraded")) return "degraded";
  if (modules.some((module) => module.status === "degraded")) return "degraded";
  if (modules.some((module) => module.status === "failed")) return "unhealthy";
  return "healthy";
}

export class SystemHealth {
  evaluate(modules: BootstrapModuleSnapshot[]): SystemHealthReport {
    const healthyCount = modules.filter((module) => module.health === "healthy").length;
    const degradedCount = modules.filter((module) => module.health === "degraded").length;
    const unhealthyCount = modules.filter((module) => module.health === "unhealthy").length;

    return {
      status: resolveOverallStatus(modules),
      healthyCount,
      degradedCount,
      unhealthyCount,
      modules: [...modules],
      checkedAt: new Date().toISOString(),
    };
  }
}

export function resolvePlatformBootStatus(
  health: BootstrapHealthStatus,
  failedCount: number,
): import("./BootstrapTypes").PlatformBootStatus {
  if (failedCount > 0) return "failed";
  if (health === "unhealthy") return "failed";
  if (health === "degraded") return "degraded";
  return "ready";
}
