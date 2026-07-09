export type AutomationTriggerType =
  | "cron"
  | "webhook"
  | "manual"
  | "api"
  | "internal_event"
  | (string & {});

export type AutomationActionType =
  | "log"
  | "notify"
  | "invoke_workflow"
  | "invoke_agent"
  | "emit_event"
  | (string & {});

export type AutomationStatus = "draft" | "active" | "paused" | "disabled";

export type AutomationRunStatus =
  | "pending"
  | "scheduled"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type AutomationEventType =
  | "automation:triggered"
  | "automation:started"
  | "automation:completed"
  | "automation:failed"
  | "automation:scheduled"
  | (string & {});

export interface AutomationContextData {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AutomationMetadata {
  workspaceId?: string;
  department?: string;
  tags?: string[];
  [key: string]: string | number | boolean | string[] | null | undefined;
}

export interface AutomationDefinition {
  id: string;
  name: string;
  description: string;
  status: AutomationStatus;
  trigger: import("./AutomationTrigger").AutomationTrigger;
  actions: import("./AutomationAction").AutomationAction[];
  metadata: AutomationMetadata;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationFilter {
  status?: AutomationStatus;
  triggerType?: AutomationTriggerType;
  department?: string;
  tag?: string;
}

export interface AutomationRunFilter {
  automationId?: string;
  status?: AutomationRunStatus;
  triggerType?: AutomationTriggerType;
}

export const AUTOMATION_TRIGGER_TYPES = {
  CRON: "cron",
  WEBHOOK: "webhook",
  MANUAL: "manual",
  API: "api",
  INTERNAL_EVENT: "internal_event",
} as const;

export const AUTOMATION_TRIGGER_LABELS: Record<string, string> = {
  cron: "Cron",
  webhook: "Webhook",
  manual: "Manual",
  api: "API",
  internal_event: "Evento Interno",
};
