export type CoreModuleId =
  | "brain"
  | "agents"
  | "automation"
  | "memory"
  | "workflow"
  | "search"
  | "notifications"
  | "analytics"
  | "authentication";

export type CoreModuleStatus =
  | "registered"
  | "loading"
  | "loaded"
  | "ready"
  | "disabled"
  | "error";

export type CoreEnvironmentName = "development" | "staging" | "production";

export type CoreLogLevel = "debug" | "info" | "warn" | "error";

export type CoreHealthStatus = "healthy" | "degraded" | "unhealthy";

export interface CoreModuleEvents {
  publishes: string[];
  subscribes: string[];
}

export interface CoreModuleDefinition {
  id: CoreModuleId;
  name: string;
  description: string;
  version: string;
  packageName?: string;
  status: CoreModuleStatus;
  dependencies: CoreModuleId[];
  events: CoreModuleEvents;
}

export interface CoreEventPayload {
  [key: string]: string | number | boolean | null | undefined;
}

export interface CoreEvent {
  id: string;
  topic: string;
  source: CoreModuleId | "core";
  payload: CoreEventPayload;
  createdAt: string;
}

export interface CoreHealthReport {
  status: CoreHealthStatus;
  modules: CoreModuleHealth[];
  checkedAt: string;
}

export interface CoreModuleHealth {
  moduleId: CoreModuleId;
  status: CoreModuleStatus;
  health: CoreHealthStatus;
  message: string;
}

export const CORE_MODULE_IDS = {
  BRAIN: "brain",
  AGENTS: "agents",
  AUTOMATION: "automation",
  MEMORY: "memory",
  WORKFLOW: "workflow",
  SEARCH: "search",
  NOTIFICATIONS: "notifications",
  ANALYTICS: "analytics",
  AUTHENTICATION: "authentication",
} as const;

export const CORE_TOPICS = {
  MODULE_REGISTERED: "core:module:registered",
  MODULE_LOADING: "core:module:loading",
  MODULE_LOADED: "core:module:loaded",
  MODULE_READY: "core:module:ready",
  MODULE_ERROR: "core:module:error",
  PLATFORM_READY: "core:platform:ready",
  HEALTH_CHECK: "core:health:check",
} as const;
