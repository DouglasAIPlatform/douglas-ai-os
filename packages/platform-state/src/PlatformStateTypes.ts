export type PlatformLayerStatus = "healthy" | "warning" | "critical" | "offline" | "unknown";

export type PlatformOverallStatus = "healthy" | "warning" | "critical" | "offline";

export type PlatformModuleOverallStatus =
  | "ready"
  | "alert"
  | "critical"
  | "offline"
  | "unknown";

export type PlatformReadinessLevel =
  | "offline"
  | "booting"
  | "partial"
  | "ready"
  | "degraded";

export interface PlatformModuleSnapshot {
  id: string;
  name: string;
  version: string;
  overallStatus: PlatformModuleOverallStatus;
  bootstrapStatus?: string;
  runtimeStatus?: string;
  healthStatus?: string;
  dosStatus?: string;
  message?: string;
}

export interface PlatformStatusSummary {
  overall: PlatformOverallStatus;
  loadedModules: number;
  readyModules: number;
  alertModules: number;
  criticalModules: number;
  offlineModules: number;
}

export interface PlatformReadiness {
  level: PlatformReadinessLevel;
  score: number;
  blockers: string[];
  readyForOperations: boolean;
  /** Fonte do score/level exibido. */
  source?: "boot-diagnostics" | "platform-fallback";
}

export interface PlatformDiagnosticsReadinessInput {
  score: number;
  status: "ready" | "degraded" | "not_ready";
  ready: boolean;
  generatedAt: string;
}

export interface PlatformLayerSnapshot {
  status: PlatformLayerStatus;
  available: boolean;
  label: string;
  detail?: string;
}

export interface PlatformSnapshot {
  generatedAt: string;
  platformVersion: string;
  summary: PlatformStatusSummary;
  readiness: PlatformReadiness;
  modules: PlatformModuleSnapshot[];
  layers: {
    bootstrap: PlatformLayerSnapshot;
    runtime: PlatformLayerSnapshot;
    health: PlatformLayerSnapshot;
    dependencyGraph: PlatformLayerSnapshot;
    eventMonitor: PlatformLayerSnapshot;
    dos: PlatformLayerSnapshot;
  };
}

export interface PlatformBootstrapLayerInput {
  status: string;
  health: string;
  readyModuleCount: number;
  totalModuleCount: number;
  isReady: boolean;
  isBooting: boolean;
  modules: Array<{
    id: string;
    name: string;
    version: string;
    status: string;
    health: string;
    message?: string;
  }>;
}

export interface PlatformRuntimeLayerInput {
  status: string;
  health: string;
  readyModuleCount: number;
  totalModuleCount: number;
  isRunning: boolean;
  isStarting: boolean;
  modules: Array<{
    id: string;
    name: string;
    version: string;
    status: string;
    health: string;
    message?: string;
  }>;
}

export interface PlatformHealthLayerInput {
  status: string;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  offlineCount: number;
  isEvaluating: boolean;
  modules: Array<{
    moduleId: string;
    moduleName: string;
    status: string;
    message?: string;
  }>;
}

export interface PlatformDependencyGraphLayerInput {
  status: string;
  healthyEdgeCount: number;
  warningEdgeCount: number;
  criticalEdgeCount: number;
  issueCount: number;
}

export interface PlatformEventMonitorLayerInput {
  totalCount: number;
  lastEventAt?: string;
  isMonitoring: boolean;
  hasCriticalRecent: boolean;
}

export interface PlatformDosLayerInput {
  status: string;
  health: string;
  runtimePhase: string;
  readyModuleCount: number;
  moduleCount: number;
  isReady: boolean;
}

export interface PlatformStateInput {
  platformVersion: string;
  bootstrap: PlatformBootstrapLayerInput | null;
  runtime: PlatformRuntimeLayerInput | null;
  health: PlatformHealthLayerInput | null;
  dependencyGraph: PlatformDependencyGraphLayerInput | null;
  eventMonitor: PlatformEventMonitorLayerInput | null;
  dos: PlatformDosLayerInput | null;
  /** Fonte preferencial de readiness quando BootDiagnostics está disponível. */
  diagnosticsReadiness?: PlatformDiagnosticsReadinessInput | null;
}

export const PLATFORM_OVERALL_STATUS_LABELS: Record<PlatformOverallStatus, string> = {
  healthy: "Saudável",
  warning: "Alerta",
  critical: "Crítico",
  offline: "Offline",
};

export const PLATFORM_READINESS_LABELS: Record<PlatformReadinessLevel, string> = {
  offline: "Offline",
  booting: "Inicializando",
  partial: "Parcial",
  ready: "Pronto",
  degraded: "Degradado",
};

export const PLATFORM_MODULE_STATUS_LABELS: Record<PlatformModuleOverallStatus, string> = {
  ready: "Pronto",
  alert: "Alerta",
  critical: "Crítico",
  offline: "Offline",
  unknown: "Desconhecido",
};
