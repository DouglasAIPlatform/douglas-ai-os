import type { RuntimeMonitorReport } from "../RuntimeTypes";
import type { IRuntimeRegistry } from "./IRuntimeRegistry";

export interface IRuntimeMonitor {
  start(onTick: () => RuntimeMonitorReport): void;
  stop(): void;
  isActive(): boolean;
  tick(registry: IRuntimeRegistry): RuntimeMonitorReport;
}
