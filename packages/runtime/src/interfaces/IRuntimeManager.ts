import type {
  GlobalRuntimeState,
  RuntimeModuleStatus,
  RuntimeMonitorReport,
  RuntimeShutdownReport,
  RuntimeStartOptions,
} from "../RuntimeTypes";

export interface IRuntimeManager {
  start(options: RuntimeStartOptions): Promise<void>;
  stop(): Promise<RuntimeShutdownReport>;
  pauseModule(moduleId: string): Promise<void>;
  resumeModule(moduleId: string): Promise<void>;
  restartModule(moduleId: string): Promise<void>;
  refreshModule(moduleId: string): Promise<void>;
  runHealthCheck(moduleId: string): Promise<import("../RuntimeTypes").RuntimeHealthStatus>;
  getState(): GlobalRuntimeState;
  getMonitorReport(): RuntimeMonitorReport;
  isRunning(): boolean;
  transitionModule(moduleId: string, status: RuntimeModuleStatus, message?: string): void;
}
