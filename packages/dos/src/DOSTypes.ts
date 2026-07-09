export type ModuleLifecycleStatus =
  | "registered"
  | "loading"
  | "loaded"
  | "ready"
  | "stopping"
  | "stopped"
  | "disabled"
  | "error";

export type PlatformHealthStatus = "healthy" | "degraded" | "unhealthy";

export type PlatformStatusName =
  | "offline"
  | "booting"
  | "ready"
  | "degraded"
  | "shutting_down"
  | "error";

export type BootPhase =
  | "idle"
  | "validating_plugins"
  | "loading_modules"
  | "initializing_runtime"
  | "running_health_check"
  | "complete"
  | "failed";

export type ShutdownPhase =
  | "idle"
  | "stopping_modules"
  | "cleanup"
  | "complete"
  | "failed";

export type RuntimePhase = "idle" | "booting" | "running" | "shutting_down" | "stopped";

export interface IManagedModule {
  id: string;
  name: string;
  description?: string;
  version: string;
  dependencies: string[];
  status: ModuleLifecycleStatus;
  packageName?: string;
}

export interface IPluginManifestContract {
  id: string;
  name: string;
  description: string;
  version: string;
  dependencies?: string[];
  routes?: Array<{ id: string; path?: string }>;
  menus?: Array<{ id: string; routeId: string }>;
}

export interface ModuleHealthEntry {
  moduleId: string;
  status: ModuleLifecycleStatus;
  health: PlatformHealthStatus;
  message: string;
}

export interface HealthReport {
  status: PlatformHealthStatus;
  modules: ModuleHealthEntry[];
  checkedAt: string;
}

export interface PlatformState {
  status: PlatformStatusName;
  bootPhase: BootPhase;
  shutdownPhase: ShutdownPhase;
  runtimePhase: RuntimePhase;
  health: PlatformHealthStatus;
  moduleCount: number;
  readyModuleCount: number;
  pluginCount: number;
  validatedPluginCount: number;
  bootedAt?: string;
  lastHealthCheckAt?: string;
}

export interface VersionInfo {
  platform: string;
  dos: string;
  kernel: string;
  environment: string;
}

export interface DiagnosticEntry {
  id: string;
  level: "info" | "warn" | "error";
  source: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface BootResult {
  success: boolean;
  phase: BootPhase;
  health: HealthReport;
  pluginErrors: string[];
  moduleErrors: string[];
  diagnostics: DiagnosticEntry[];
}

export interface ShutdownResult {
  success: boolean;
  phase: ShutdownPhase;
  diagnostics: DiagnosticEntry[];
}

export interface BootOptions {
  modules: IManagedModule[];
  plugins?: IPluginManifestContract[];
}

export const DOS_TOPICS = {
  BOOT_STARTED: "dos:boot:started",
  BOOT_COMPLETE: "dos:boot:complete",
  BOOT_FAILED: "dos:boot:failed",
  SHUTDOWN_STARTED: "dos:shutdown:started",
  SHUTDOWN_COMPLETE: "dos:shutdown:complete",
  MODULE_LOADING: "dos:module:loading",
  MODULE_READY: "dos:module:ready",
  MODULE_ERROR: "dos:module:error",
  PLUGIN_VALIDATED: "dos:plugin:validated",
  PLUGIN_REJECTED: "dos:plugin:rejected",
  HEALTH_CHECK: "dos:health:check",
  PLATFORM_READY: "dos:platform:ready",
} as const;

export const PLATFORM_STATUS_LABELS: Record<PlatformStatusName, string> = {
  offline: "Offline",
  booting: "Inicializando",
  ready: "Pronto",
  degraded: "Degradado",
  shutting_down: "Encerrando",
  error: "Erro",
};

export const BOOT_PHASE_LABELS: Record<BootPhase, string> = {
  idle: "Idle",
  validating_plugins: "Validando plugins",
  loading_modules: "Carregando módulos",
  initializing_runtime: "Inicializando runtime",
  running_health_check: "Verificando saúde",
  complete: "Completo",
  failed: "Falhou",
};
