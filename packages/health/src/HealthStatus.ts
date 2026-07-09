import type { HealthModuleResult, PlatformHealthStatus } from "./HealthTypes";

export function resolveModuleHealthStatus(
  modules: HealthModuleResult[],
): PlatformHealthStatus {
  if (modules.length === 0) return "offline";
  if (modules.some((module) => module.status === "critical")) return "critical";
  if (modules.some((module) => module.status === "offline")) return "critical";
  if (modules.some((module) => module.status === "warning")) return "warning";
  if (modules.every((module) => module.status === "offline")) return "offline";
  return "healthy";
}

export class HealthStatus {
  evaluate(modules: HealthModuleResult[]): {
    status: PlatformHealthStatus;
    healthyCount: number;
    warningCount: number;
    criticalCount: number;
    offlineCount: number;
  } {
    const healthyCount = modules.filter((module) => module.status === "healthy").length;
    const warningCount = modules.filter((module) => module.status === "warning").length;
    const criticalCount = modules.filter((module) => module.status === "critical").length;
    const offlineCount = modules.filter((module) => module.status === "offline").length;

    return {
      status: resolveModuleHealthStatus(modules),
      healthyCount,
      warningCount,
      criticalCount,
      offlineCount,
    };
  }
}
