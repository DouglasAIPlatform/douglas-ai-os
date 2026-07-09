import type { HealthHistoryEntry, HealthReport } from "./HealthTypes";

const DEFAULT_CAPACITY = 50;

export class HealthHistory {
  private entries: HealthHistoryEntry[] = [];

  constructor(private readonly capacity = DEFAULT_CAPACITY) {}

  record(report: HealthReport): HealthHistoryEntry {
    const entry: HealthHistoryEntry = {
      report,
      recordedAt: new Date().toISOString(),
    };

    this.entries = [entry, ...this.entries].slice(0, this.capacity);
    return entry;
  }

  getLatest(): HealthReport | null {
    return this.entries[0]?.report ?? null;
  }

  getEntries(limit = 10): HealthHistoryEntry[] {
    return this.entries.slice(0, limit);
  }

  getTrend(): PlatformHealthTrend {
    const recent = this.entries.slice(0, 10);
    return {
      totalChecks: this.entries.length,
      recentStatuses: recent.map((entry) => entry.report.status),
      lastStatus: recent[0]?.report.status ?? "offline",
    };
  }

  clear(): void {
    this.entries = [];
  }
}

export interface PlatformHealthTrend {
  totalChecks: number;
  recentStatuses: HealthReport["status"][];
  lastStatus: HealthReport["status"];
}
