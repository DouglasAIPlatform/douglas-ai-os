import type { DemoDataConfig } from "./DemoDataConfig";
import { DEFAULT_DEMO_DATA_CONFIG } from "./DemoDataConfig";
import type { DemoDataPolicy } from "./DemoDataPolicy";
import {
  DEVELOPMENT_DEMO_POLICY,
  PRODUCTION_DEMO_POLICY,
} from "./DemoDataPolicy";
import { DEMO_WIDGET_SOURCES, type DemoDataSource } from "./DemoDataSource";

function isWidgetDemoSource(source: DemoDataSource): boolean {
  return DEMO_WIDGET_SOURCES.includes(source);
}

export function resolveDemoDataPolicy(
  config: DemoDataConfig = DEFAULT_DEMO_DATA_CONFIG,
): DemoDataPolicy {
  if (config.mode === "development") {
    return {
      ...DEVELOPMENT_DEMO_POLICY,
      demoTickerIntervalMs: config.demoTickerIntervalMs ?? DEVELOPMENT_DEMO_POLICY.demoTickerIntervalMs,
    };
  }

  if (config.mode === "production") {
    return {
      ...PRODUCTION_DEMO_POLICY,
      demoTickerIntervalMs: config.demoTickerIntervalMs ?? PRODUCTION_DEMO_POLICY.demoTickerIntervalMs,
    };
  }

  const enableDemoEvents = config.enableDemoEvents ?? false;
  const tickerInterval = config.demoTickerIntervalMs ?? 8000;

  if (!enableDemoEvents) {
    return {
      mode: "manual",
      enableDemoEvents: false,
      enableDemoSeeds: false,
      enableDemoTicker: false,
      enableDemoWidgets: config.enableDemoWidgets ?? false,
      demoTickerIntervalMs: tickerInterval,
    };
  }

  return {
    mode: "manual",
    enableDemoEvents: true,
    enableDemoSeeds: config.enableDemoSeeds ?? true,
    enableDemoTicker: config.enableDemoTicker ?? true,
    enableDemoWidgets: config.enableDemoWidgets ?? true,
    demoTickerIntervalMs: tickerInterval,
  };
}

export function isDemoSourceEnabled(
  policy: DemoDataPolicy,
  source: DemoDataSource,
): boolean {
  if (!policy.enableDemoEvents) {
    if (isWidgetDemoSource(source)) {
      return policy.enableDemoWidgets;
    }
    if (
      source === "event_monitor_seeds" ||
      source === "event_monitor_ticker" ||
      source === "event_monitor_events"
    ) {
      return false;
    }
  }

  switch (source) {
    case "event_monitor_seeds":
      return policy.enableDemoEvents && policy.enableDemoSeeds;
    case "event_monitor_ticker":
      return policy.enableDemoEvents && policy.enableDemoTicker;
    case "event_monitor_events":
      return policy.enableDemoEvents && (policy.enableDemoSeeds || policy.enableDemoTicker);
    case "widget_mocks":
    case "bootstrap_mocks":
    case "memory_mocks":
    case "brain_mocks":
    case "mission_mocks":
    case "graph_mocks":
      return policy.enableDemoWidgets;
    default:
      return false;
  }
}

/** Compatível com EventNoisePolicy do @douglas/monitor. */
export function toEventNoisePolicy(policy: DemoDataPolicy): {
  enableDemoEvents: boolean;
  demoTickerIntervalMs?: number;
} {
  return {
    enableDemoEvents: policy.enableDemoEvents && policy.enableDemoTicker,
    demoTickerIntervalMs: policy.demoTickerIntervalMs,
  };
}
