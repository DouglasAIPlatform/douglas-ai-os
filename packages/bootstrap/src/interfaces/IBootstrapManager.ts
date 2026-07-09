import type {
  BootstrapModuleDefinition,
  BootstrapOptions,
  GlobalPlatformState,
  StartupReport,
  SystemHealthReport,
} from "../BootstrapTypes";

export interface IBootstrapManager {
  boot(options: BootstrapOptions): Promise<StartupReport>;
  getState(): GlobalPlatformState;
  getHealth(): SystemHealthReport;
  getStartupReport(): StartupReport | null;
  isReady(): boolean;
}
