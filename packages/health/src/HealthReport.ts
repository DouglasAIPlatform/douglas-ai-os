import type { HealthModuleResult, HealthReport } from "./HealthTypes";
import { HealthStatus } from "./HealthStatus";

export class HealthReportBuilder {
  build(modules: HealthModuleResult[]): HealthReport {
    const summary = new HealthStatus().evaluate(modules);
    const lastCheckedAt = modules.reduce((latest, module) => {
      return module.lastCheckedAt > latest ? module.lastCheckedAt : latest;
    }, modules[0]?.lastCheckedAt ?? new Date().toISOString());

    return {
      status: summary.status,
      healthyCount: summary.healthyCount,
      warningCount: summary.warningCount,
      criticalCount: summary.criticalCount,
      offlineCount: summary.offlineCount,
      moduleCount: modules.length,
      modules: [...modules],
      lastCheckedAt,
      generatedAt: new Date().toISOString(),
    };
  }
}
