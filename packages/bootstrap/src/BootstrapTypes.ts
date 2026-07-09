export type BootstrapModuleStatus =
  | "pending"
  | "loading"
  | "ready"
  | "degraded"
  | "failed"
  | "skipped";

export type BootstrapHealthStatus = "healthy" | "degraded" | "unhealthy";

export type PlatformBootStatus =
  | "offline"
  | "booting"
  | "ready"
  | "degraded"
  | "failed";

export interface BootstrapModuleResult {
  id: string;
  name: string;
  version: string;
  status: BootstrapModuleStatus;
  initTimeMs: number;
  health: BootstrapHealthStatus;
  message?: string;
}

export interface BootstrapModuleDefinition {
  id: string;
  name: string;
  version: string;
  dependencies?: string[];
  load: () => BootstrapModuleResult | Promise<BootstrapModuleResult>;
}

export interface BootstrapModuleSnapshot extends BootstrapModuleResult {
  loadedAt: string;
}

export interface GlobalPlatformState {
  status: PlatformBootStatus;
  platformVersion: string;
  bootStartedAt?: string;
  bootCompletedAt?: string;
  bootDurationMs: number;
  modules: BootstrapModuleSnapshot[];
  health: BootstrapHealthStatus;
  readyModuleCount: number;
  totalModuleCount: number;
}

export interface SystemHealthReport {
  status: BootstrapHealthStatus;
  healthyCount: number;
  degradedCount: number;
  unhealthyCount: number;
  modules: BootstrapModuleSnapshot[];
  checkedAt: string;
}

export interface StartupReport {
  success: boolean;
  platformVersion: string;
  bootDurationMs: number;
  moduleCount: number;
  readyCount: number;
  degradedCount: number;
  failedCount: number;
  modules: BootstrapModuleResult[];
  health: SystemHealthReport;
  generatedAt: string;
}

export interface BootstrapOptions {
  platformVersion: string;
  modules: BootstrapModuleDefinition[];
}

export const BOOTSTRAP_STATUS_LABELS: Record<BootstrapModuleStatus, string> = {
  pending: "Pendente",
  loading: "Carregando",
  ready: "Pronto",
  degraded: "Degradado",
  failed: "Falhou",
  skipped: "Ignorado",
};

export const BOOTSTRAP_HEALTH_LABELS: Record<BootstrapHealthStatus, string> = {
  healthy: "Saudável",
  degraded: "Degradado",
  unhealthy: "Crítico",
};

export const PLATFORM_BOOT_STATUS_LABELS: Record<PlatformBootStatus, string> = {
  offline: "Offline",
  booting: "Inicializando",
  ready: "Pronto",
  degraded: "Degradado",
  failed: "Falhou",
};
