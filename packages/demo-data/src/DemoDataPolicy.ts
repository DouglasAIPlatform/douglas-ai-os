import type { DemoDataMode } from "./DemoDataSource";

export interface DemoDataPolicy {
  mode: DemoDataMode;
  /** Master switch — seeds + ticker do Event Monitor. */
  enableDemoEvents: boolean;
  enableDemoSeeds: boolean;
  enableDemoTicker: boolean;
  enableDemoWidgets: boolean;
  demoTickerIntervalMs: number;
}

export const DEVELOPMENT_DEMO_POLICY: DemoDataPolicy = {
  mode: "development",
  enableDemoEvents: true,
  enableDemoSeeds: true,
  enableDemoTicker: true,
  enableDemoWidgets: true,
  demoTickerIntervalMs: 8000,
};

export const PRODUCTION_DEMO_POLICY: DemoDataPolicy = {
  mode: "production",
  enableDemoEvents: false,
  enableDemoSeeds: false,
  enableDemoTicker: false,
  enableDemoWidgets: false,
  demoTickerIntervalMs: 8000,
};
