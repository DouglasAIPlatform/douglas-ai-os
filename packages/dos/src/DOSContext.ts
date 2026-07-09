import { createContext } from "react";
import type { OperatingSystem } from "./OperatingSystem";
import type {
  BootResult,
  HealthReport,
  PlatformState,
  ShutdownResult,
} from "./DOSTypes";
import type { IKernel } from "./interfaces/IKernel";

export interface DOSContextValue {
  os: OperatingSystem;
  kernel: IKernel;
  state: PlatformState;
  health: HealthReport;
  lastBootResult: BootResult | null;
  lastShutdownResult: ShutdownResult | null;
  isReady: boolean;
  boot: () => BootResult;
  shutdown: () => ShutdownResult;
}

export const DOSContext = createContext<DOSContextValue | null>(null);
