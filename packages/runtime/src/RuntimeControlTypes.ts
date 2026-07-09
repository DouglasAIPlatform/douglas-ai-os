export type RuntimeActionType =
  | "refresh_module"
  | "pause_module"
  | "resume_module"
  | "restart_module"
  | "run_health_check";

export type RuntimeActionOutcome = "success" | "failed";

export interface RuntimeCommand {
  id: string;
  moduleId: string;
  action: RuntimeActionType;
  requestedAt: string;
  requestedBy: string;
}

export interface RuntimeActionResult {
  commandId: string;
  moduleId: string;
  action: RuntimeActionType;
  success: boolean;
  message: string;
  durationMs: number;
  completedAt: string;
  moduleStatusAfter?: string;
  healthAfter?: string;
}

export interface RuntimeAction {
  type: RuntimeActionType;
  moduleId: string;
  label: string;
  enabled: boolean;
  reason?: string;
}

export interface RuntimeActionEventPayload {
  commandId: string;
  moduleId: string;
  action: RuntimeActionType;
  message?: string;
  success?: boolean;
  durationMs?: number;
}

export const RUNTIME_ACTION_LABELS: Record<RuntimeActionType, string> = {
  refresh_module: "Refresh",
  pause_module: "Pause",
  resume_module: "Resume",
  restart_module: "Restart",
  run_health_check: "Health Check",
};

export const RUNTIME_ACTION_TOPICS = {
  started: "runtime:action:started",
  completed: "runtime:action:completed",
  failed: "runtime:action:failed",
} as const;
