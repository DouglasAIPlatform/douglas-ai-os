export type ReadinessStatus = "ready" | "degraded" | "not_ready";

export type DiagnosticSeverity = "critical" | "warning" | "info";

export interface DiagnosticIssue {
  id: string;
  severity: DiagnosticSeverity;
  message: string;
  moduleId?: string;
  source: string;
  detectedAt: string;
}

export interface DiagnosticRecommendation {
  id: string;
  priority: "high" | "medium" | "low";
  message: string;
  moduleId?: string;
}

export interface ModuleStartupDiagnostic {
  moduleId: string;
  moduleName: string;
  bootstrapStatus: string;
  runtimeStatus?: string;
  healthStatus?: string;
  initTimeMs?: number;
  loadedAt?: string;
  ready: boolean;
  message?: string;
}

export interface StartupTimelineEntry {
  order: number;
  moduleId: string;
  moduleName: string;
  timestamp: string;
  initTimeMs: number;
  status: string;
}

export interface StartupTimeline {
  entries: StartupTimelineEntry[];
  bootDurationMs: number;
  bootStartedAt?: string;
  bootCompletedAt?: string;
}

export interface ReadinessReport {
  ready: boolean;
  score: number;
  status: ReadinessStatus;
  criticalIssues: DiagnosticIssue[];
  warnings: DiagnosticIssue[];
  recommendations: DiagnosticRecommendation[];
  moduleDiagnostics: ModuleStartupDiagnostic[];
  startupTimeline: StartupTimeline;
  recentCriticalEvents: DiagnosticRecentEvent[];
  generatedAt: string;
}

export interface DiagnosticRecentEvent {
  id: string;
  source: string;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
}

export interface DiagnosticsBootstrapInput {
  status: string;
  isReady: boolean;
  isBooting: boolean;
  bootDurationMs: number;
  bootStartedAt?: string;
  bootCompletedAt?: string;
  readyModuleCount: number;
  totalModuleCount: number;
  modules: Array<{
    id: string;
    name: string;
    status: string;
    health: string;
    initTimeMs: number;
    loadedAt?: string;
    message?: string;
  }>;
}

export interface DiagnosticsRuntimeInput {
  status: string;
  isRunning: boolean;
  isStarting: boolean;
  readyModuleCount: number;
  totalModuleCount: number;
  uptimeMs: number;
  modules: Array<{
    id: string;
    name: string;
    status: string;
    health: string;
    message?: string;
  }>;
}

export interface DiagnosticsHealthInput {
  status: string;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  offlineCount: number;
  modules: Array<{
    moduleId: string;
    moduleName: string;
    status: string;
    message?: string;
  }>;
}

export interface DiagnosticsGraphInput {
  status: string;
  issueCount: number;
  circularDependencyCount: number;
  criticalUnavailableCount: number;
  issues: Array<{ type: string; message: string; severity: string; moduleId?: string }>;
}

export interface DiagnosticsEventInput {
  events: Array<{
    id: string;
    source: string;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
  }>;
}

export interface DiagnosticsPlatformInput {
  readinessScore: number;
  readinessLevel: string;
  blockers: string[];
}

export interface DiagnosticsInput {
  platformVersion: string;
  bootstrap: DiagnosticsBootstrapInput | null;
  runtime: DiagnosticsRuntimeInput | null;
  health: DiagnosticsHealthInput | null;
  dependencyGraph: DiagnosticsGraphInput | null;
  eventMonitor: DiagnosticsEventInput | null;
  platform: DiagnosticsPlatformInput | null;
}

export interface DiagnosticsReportEventPayload {
  reportId: string;
  ready: boolean;
  score: number;
  status: ReadinessStatus;
  message?: string;
  durationMs?: number;
}

export const READINESS_STATUS_LABELS: Record<ReadinessStatus, string> = {
  ready: "Pronto",
  degraded: "Degradado",
  not_ready: "Não pronto",
};

export const DIAGNOSTICS_EVENT_TOPICS = {
  started: "diagnostics:report:started",
  completed: "diagnostics:report:completed",
  failed: "diagnostics:report:failed",
} as const;
