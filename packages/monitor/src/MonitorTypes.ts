export type EventSeverity = "info" | "success" | "warning" | "error" | "critical";

export type MonitorModuleSource =
  | "core"
  | "dos"
  | "runtime"
  | "brain"
  | "agents"
  | "missions"
  | "workflow"
  | "automation"
  | "analytics"
  | "notifications"
  | "plugins"
  | "health";

export interface LiveEvent {
  id: string;
  source: MonitorModuleSource | (string & {});
  type: string;
  severity: EventSeverity;
  message: string;
  timestamp: string;
  metadata: Record<string, string | number | boolean | null>;
  /** true para seeds e ticker mock — false/ausente para eventos reais do Event Bus. */
  demo?: boolean;
}

export interface EventFilterCriteria {
  source?: MonitorModuleSource | string;
  severity?: EventSeverity;
  type?: string;
  periodStart?: string;
  periodEnd?: string;
  /** Quando true, oculta eventos marcados com demo: true. */
  excludeDemo?: boolean;
}

export interface EventTimelineEntry {
  event: LiveEvent;
  index: number;
}

export interface EventInspection {
  event: LiveEvent;
  relatedCount: number;
  sameSourceCount: number;
  sameTypeCount: number;
}

export interface EventMonitorSnapshot {
  events: LiveEvent[];
  totalCount: number;
  filteredCount: number;
  lastEventAt?: string;
  activeFilter: EventFilterCriteria;
}

export const EVENT_SEVERITY_LABELS: Record<EventSeverity, string> = {
  info: "Info",
  success: "Sucesso",
  warning: "Alerta",
  error: "Erro",
  critical: "Crítico",
};

export const MONITOR_MODULE_SOURCE_LABELS: Record<MonitorModuleSource, string> = {
  core: "Core",
  dos: "DOS",
  runtime: "Runtime",
  brain: "Brain",
  agents: "Agents",
  missions: "Mission Control",
  workflow: "Workflow",
  automation: "Automation",
  analytics: "Analytics",
  notifications: "Notifications",
  plugins: "Plugin System",
  health: "Health Engine",
};

export const MONITOR_MODULE_SOURCES: MonitorModuleSource[] = [
  "core",
  "dos",
  "runtime",
  "brain",
  "agents",
  "missions",
  "workflow",
  "automation",
  "analytics",
  "notifications",
  "plugins",
  "health",
];
