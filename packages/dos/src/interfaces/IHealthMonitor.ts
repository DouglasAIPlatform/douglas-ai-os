import type { HealthReport } from "../DOSTypes";
import type { IModuleRegistry } from "./IModuleRegistry";

export interface IHealthMonitor {
  run(registry: IModuleRegistry): HealthReport;
}
