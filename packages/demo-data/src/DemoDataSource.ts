export type DemoDataMode = "development" | "production" | "manual";

export type DemoDataSource =
  | "event_monitor_seeds"
  | "event_monitor_ticker"
  | "event_monitor_events"
  | "widget_mocks"
  | "bootstrap_mocks"
  | "memory_mocks"
  | "brain_mocks"
  | "mission_mocks"
  | "graph_mocks";

export const DEMO_DATA_SOURCE_LABELS: Record<DemoDataSource, string> = {
  event_monitor_seeds: "Seeds do Event Monitor",
  event_monitor_ticker: "Ticker mock do Event Monitor",
  event_monitor_events: "Eventos demo do Event Monitor",
  widget_mocks: "Dados mock de widgets",
  bootstrap_mocks: "Seeds de bootstrap",
  memory_mocks: "Seeds de memory engine",
  brain_mocks: "Mocks do Brain",
  mission_mocks: "Seeds de missões",
  graph_mocks: "Fallback estático do grafo de dependências",
};

/** Fontes não-evento controladas por `enableDemoWidgets`. */
export const DEMO_WIDGET_SOURCES: DemoDataSource[] = [
  "widget_mocks",
  "bootstrap_mocks",
  "memory_mocks",
  "brain_mocks",
  "mission_mocks",
  "graph_mocks",
];
