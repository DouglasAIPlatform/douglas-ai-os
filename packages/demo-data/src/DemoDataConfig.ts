import type { DemoDataMode } from "./DemoDataSource";

export interface DemoDataConfig {
  mode: DemoDataMode;
  /** Overrides usados somente quando mode === "manual". */
  enableDemoEvents?: boolean;
  enableDemoSeeds?: boolean;
  enableDemoTicker?: boolean;
  enableDemoWidgets?: boolean;
  demoTickerIntervalMs?: number;
}

export const DEFAULT_DEMO_DATA_CONFIG: DemoDataConfig = {
  mode: "development",
  demoTickerIntervalMs: 8000,
};
