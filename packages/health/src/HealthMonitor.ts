import type { HealthReport } from "./HealthTypes";

export interface IHealthMonitor {
  start(onTick: () => HealthReport): void;
  stop(): void;
  isActive(): boolean;
}

const DEFAULT_INTERVAL_MS = 10000;

export class HealthMonitor implements IHealthMonitor {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private active = false;

  constructor(private readonly intervalMs = DEFAULT_INTERVAL_MS) {}

  start(onTick: () => HealthReport): void {
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
}
