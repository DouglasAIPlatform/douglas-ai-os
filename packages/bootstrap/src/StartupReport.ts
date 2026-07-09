import type {
  BootstrapModuleResult,
  StartupReport,
  SystemHealthReport,
} from "./BootstrapTypes";
import { SystemHealth } from "./SystemHealth";

export class StartupReportBuilder {
  build(
    platformVersion: string,
    bootDurationMs: number,
    modules: BootstrapModuleResult[],
    health: SystemHealthReport,
  ): StartupReport {
    const readyCount = modules.filter((module) => module.status === "ready").length;
    const degradedCount = modules.filter((module) => module.status === "degraded").length;
    const failedCount = modules.filter((module) => module.status === "failed").length;

    return {
      success: failedCount === 0 && health.status !== "unhealthy",
      platformVersion,
      bootDurationMs,
      moduleCount: modules.length,
      readyCount,
      degradedCount,
      failedCount,
      modules,
      health,
      generatedAt: new Date().toISOString(),
    };
  }

  static fromModules(
    platformVersion: string,
    bootDurationMs: number,
    modules: BootstrapModuleResult[],
  ): StartupReport {
    const health = new SystemHealth().evaluate(
      modules.map((module) => ({ ...module, loadedAt: new Date().toISOString() })),
    );

    return new StartupReportBuilder().build(
      platformVersion,
      bootDurationMs,
      modules,
      health,
    );
  }
}
