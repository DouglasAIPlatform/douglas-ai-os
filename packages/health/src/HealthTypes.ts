export type HealthModuleStatus = "healthy" | "warning" | "critical" | "offline";

export type PlatformHealthStatus = "healthy" | "warning" | "critical" | "offline";

export interface HealthIssue {
  id: string;
  severity: "warning" | "critical";
  message: string;
  moduleId: string;
  detectedAt: string;
}

export interface HealthRecommendation {
  id: string;
  priority: "low" | "medium" | "high";
  message: string;
  moduleId: string;
}

export interface HealthModuleResult {
  moduleId: string;
  moduleName: string;
  status: HealthModuleStatus;
  message: string;
  lastCheckedAt: string;
  uptimeMs: number;
  issues: HealthIssue[];
  recommendations: HealthRecommendation[];
  metadata: Record<string, string | number | boolean>;
}

export interface HealthReport {
  status: PlatformHealthStatus;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  offlineCount: number;
  moduleCount: number;
  modules: HealthModuleResult[];
  lastCheckedAt: string;
  generatedAt: string;
}

export interface HealthCheckDefinition {
  id: string;
  name: string;
  check: () => HealthModuleResult | Promise<HealthModuleResult>;
}

export interface HealthHistoryEntry {
  report: HealthReport;
  recordedAt: string;
}

export const HEALTH_MODULE_STATUS_LABELS: Record<HealthModuleStatus, string> = {
  healthy: "Saudável",
  warning: "Alerta",
  critical: "Crítico",
  offline: "Offline",
};

export const PLATFORM_HEALTH_STATUS_LABELS: Record<PlatformHealthStatus, string> = {
  healthy: "Saudável",
  warning: "Alerta",
  critical: "Crítico",
  offline: "Offline",
};
