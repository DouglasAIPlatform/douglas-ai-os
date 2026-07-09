import type { ShutdownResult } from "../DOSTypes";

export interface IShutdownManager {
  shutdown(): ShutdownResult;
  getLastResult(): ShutdownResult | null;
}
