export type RuntimeModuleStatus =
  | "initializing"
  | "ready"
  | "paused"
  | "restarting"
  | "stopping"
  | "stopped"
  | "failed";

export type RuntimeHealthStatus = "healthy" | "degraded" | "unhealthy";

export type PlatformRuntimeStatus =
  | "offline"
  | "starting"
  | "running"
  | "paused"
  | "stopping"
  | "stopped"
  | "failed";

export interface RuntimeModuleSnapshot {
  id: string;
  name: string;
  version: string;
  status: RuntimeModuleStatus;
  health: RuntimeHealthStatus;
  uptimeMs: number;
  lastTransitionAt: string;
  message?: string;
}

export interface GlobalRuntimeState {
  status: PlatformRuntimeStatus;
  platformVersion: string;
  startedAt?: string;
  stoppedAt?: string;
  uptimeMs: number;
  modules: RuntimeModuleSnapshot[];
  health: RuntimeHealthStatus;
  readyModuleCount: number;
  totalModuleCount: number;
  lastMonitorCheckAt?: string;
}

export interface RuntimeMonitorReport {
  status: RuntimeHealthStatus;
  healthyCount: number;
  degradedCount: number;
  unhealthyCount: number;
  modules: RuntimeModuleSnapshot[];
  checkedAt: string;
}

export interface RuntimeModuleInitContext {
  moduleId: string;
  publish: (topic: string, payload: Record<string, unknown>) => void;
  subscribe: (
    topic: string,
    handler: (payload: Record<string, unknown>) => void,
  ) => () => void;
}

export interface RuntimeModuleDefinition {
  id: string;
  name: string;
  version: string;
  initialize: (context: RuntimeModuleInitContext) => void | Promise<void>;
  start?: () => void | Promise<void>;
  stop?: () => void | Promise<void>;
  pause?: () => void | Promise<void>;
  resume?: () => void | Promise<void>;
  restart?: () => void | Promise<void>;
  healthCheck?: () => RuntimeHealthStatus;
}

export interface RuntimeStartOptions {
  platformVersion: string;
  modules: RuntimeModuleDefinition[];
}

export interface RuntimeShutdownReport {
  success: boolean;
  platformVersion: string;
  shutdownDurationMs: number;
  stoppedCount: number;
  failedCount: number;
  modules: RuntimeModuleSnapshot[];
  generatedAt: string;
}

export const RUNTIME_MODULE_STATUS_LABELS: Record<RuntimeModuleStatus, string> = {
  initializing: "Inicializando",
  ready: "Pronto",
  paused: "Pausado",
  restarting: "Reiniciando",
  stopping: "Encerrando",
  stopped: "Parado",
  failed: "Falhou",
};

export const RUNTIME_HEALTH_LABELS: Record<RuntimeHealthStatus, string> = {
  healthy: "Saudável",
  degraded: "Degradado",
  unhealthy: "Crítico",
};

export const PLATFORM_RUNTIME_STATUS_LABELS: Record<PlatformRuntimeStatus, string> = {
  offline: "Offline",
  starting: "Iniciando",
  running: "Em execução",
  paused: "Pausado",
  stopping: "Encerrando",
  stopped: "Parado",
  failed: "Falhou",
};
