export type OperationalActionType =
  | "refresh_module"
  | "run_health_check"
  | "pause_module"
  | "resume_module"
  | "restart_module";

export interface OperationalStatus {
  overallStatus: string;
  readinessScore: number;
  readinessLevel: string;
  platformReady: boolean;
  readyModules: number;
  alertModules: number;
  criticalModules: number;
  offlineModules: number;
  loadedModules: number;
  healthStatus: string;
  healthLabel: string;
  diagnosticsStatus?: string;
  diagnosticsScore?: number;
  diagnosticsReady?: boolean;
  diagnosticsGeneratedAt?: string;
  blockers: string[];
  generatedAt: string;
}

export interface OperationalActionAvailability {
  moduleId: string;
  moduleName: string;
  action: OperationalActionType;
  label: string;
  available: boolean;
  requiresConfirmation: boolean;
  blockedByReadiness: boolean;
  reason?: string;
}

export interface OperationalRecommendation {
  id: string;
  priority: "high" | "medium" | "low";
  message: string;
  source: string;
}

export interface OperationalRecentAction {
  commandId: string;
  moduleId: string;
  action: OperationalActionType;
  actionLabel: string;
  success: boolean;
  message: string;
  completedAt: string;
  durationMs: number;
}

export interface OperationalCriticalEvent {
  id: string;
  message: string;
  source: string;
  severity: string;
  timestamp: string;
}

export interface OperationalCommandCenterSnapshot {
  status: OperationalStatus;
  recommendations: OperationalRecommendation[];
  recentActions: OperationalRecentAction[];
  recentCriticalEvents: OperationalCriticalEvent[];
  actionAvailability: OperationalActionAvailability[];
}

export interface CommandCenterPlatformInput {
  overallStatus: string;
  readinessScore: number;
  readinessLevel: string;
  platformReady: boolean;
  readyModules: number;
  alertModules: number;
  criticalModules: number;
  offlineModules: number;
  loadedModules: number;
  blockers: string[];
  healthStatus?: string;
  generatedAt: string;
}

export interface CommandCenterDiagnosticsInput {
  ready: boolean;
  score: number;
  status: string;
  generatedAt: string;
  criticalIssueCount: number;
  warningCount: number;
  recommendations: Array<{ id: string; priority: "high" | "medium" | "low"; message: string }>;
}

export interface CommandCenterRuntimeModuleInput {
  id: string;
  name: string;
  status: string;
  actions: Array<{
    type: OperationalActionType;
    enabled: boolean;
    reason?: string;
  }>;
}

export interface CommandCenterRuntimeActionInput {
  commandId: string;
  moduleId: string;
  action: OperationalActionType;
  actionLabel: string;
  success: boolean;
  message: string;
  completedAt: string;
  durationMs: number;
}

export interface CommandCenterEventInput {
  id: string;
  message: string;
  source: string;
  severity: string;
  timestamp: string;
}

export interface OperationalCommandCenterInput {
  platform: CommandCenterPlatformInput;
  diagnostics: CommandCenterDiagnosticsInput | null;
  runtimeModules: CommandCenterRuntimeModuleInput[];
  recentActions: CommandCenterRuntimeActionInput[];
  criticalEvents: CommandCenterEventInput[];
}

export const OPERATIONAL_ACTION_LABELS: Record<OperationalActionType, string> = {
  refresh_module: "Refresh",
  pause_module: "Pause",
  resume_module: "Resume",
  restart_module: "Restart",
  run_health_check: "Health Check",
};

export const HEALTH_STATUS_LABELS: Record<string, string> = {
  healthy: "Saudável",
  warning: "Alerta",
  critical: "Crítico",
  offline: "Offline",
};
