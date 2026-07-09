import { createContext } from "react";
import type { BootstrapManager } from "./BootstrapManager";
import type { PlatformBootstrap } from "./PlatformBootstrap";
import type {
  GlobalPlatformState,
  StartupReport,
  SystemHealthReport,
} from "./BootstrapTypes";

export interface PlatformBootstrapContextValue {
  bootstrap: PlatformBootstrap;
  manager: BootstrapManager;
  state: GlobalPlatformState;
  health: SystemHealthReport;
  startupReport: StartupReport | null;
  isBooting: boolean;
  isReady: boolean;
}

export const PlatformBootstrapContext =
  createContext<PlatformBootstrapContextValue | null>(null);
