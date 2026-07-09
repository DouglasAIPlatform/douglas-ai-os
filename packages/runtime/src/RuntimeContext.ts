import { createContext } from "react";
import type { PlatformRuntime } from "./PlatformRuntime";
import type { RuntimeManager } from "./RuntimeManager";
import type {
  GlobalRuntimeState,
  RuntimeMonitorReport,
  RuntimeShutdownReport,
} from "./RuntimeTypes";

export interface RuntimeContextValue {
  runtime: PlatformRuntime;
  manager: RuntimeManager;
  state: GlobalRuntimeState;
  monitorReport: RuntimeMonitorReport | null;
  shutdownReport: RuntimeShutdownReport | null;
  isStarting: boolean;
  isRunning: boolean;
}

export const RuntimeContext = createContext<RuntimeContextValue | null>(null);
