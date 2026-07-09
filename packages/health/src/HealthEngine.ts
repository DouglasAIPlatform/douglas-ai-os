import type {
  HealthCheckDefinition,
  HealthHistoryEntry,
  HealthModuleResult,
  HealthReport,
} from "./HealthTypes";
import { HealthCheck } from "./HealthCheck";
import { HealthHistory } from "./HealthHistory";
import type { IHealthMonitor } from "./HealthMonitor";
import { HealthMonitor } from "./HealthMonitor";
import { HealthReportBuilder } from "./HealthReport";

export interface HealthEngineOptions {
  checks?: HealthCheckDefinition[];
  healthCheck?: HealthCheck;
  history?: HealthHistory;
  monitor?: IHealthMonitor;
  historyCapacity?: number;
  monitorIntervalMs?: number;
}

export class HealthEngine {
  private checks: HealthCheckDefinition[] = [];
  private readonly healthCheck: HealthCheck;
  private readonly history: HealthHistory;
  private readonly monitor: IHealthMonitor;
  private latestReport: HealthReport | null = null;

  constructor(options: HealthEngineOptions = {}) {
    this.checks = options.checks ?? [];
    this.healthCheck = options.healthCheck ?? new HealthCheck();
    this.history = options.history ?? new HealthHistory(options.historyCapacity);
    this.monitor =
      options.monitor ??
      new HealthMonitor(options.monitorIntervalMs);
  }

  registerChecks(checks: HealthCheckDefinition[]): void {
    this.checks = checks;
  }

  async evaluate(): Promise<HealthReport> {
    const modules = await this.healthCheck.runAll(this.checks);
    const report = new HealthReportBuilder().build(modules);
    this.latestReport = report;
    this.history.record(report);
    return report;
  }

  startMonitoring(onUpdate?: (report: HealthReport) => void): void {
    this.monitor.start(() => {
      void this.evaluate().then((report) => {
        onUpdate?.(report);
      });
      return this.latestReport!;
    });
  }

  stopMonitoring(): void {
    this.monitor.stop();
  }

  getLatestReport(): HealthReport | null {
    return this.latestReport;
  }

  getHistory(limit?: number): HealthHistoryEntry[] {
    return this.history.getEntries(limit);
  }

  getModuleResults(): HealthModuleResult[] {
    return this.latestReport?.modules ?? [];
  }

  isMonitoring(): boolean {
    return this.monitor.isActive();
  }
}

export function createHealthEngine(options?: HealthEngineOptions): HealthEngine {
  return new HealthEngine(options);
}
