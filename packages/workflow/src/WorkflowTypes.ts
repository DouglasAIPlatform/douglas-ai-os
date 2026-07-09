export type WorkflowDepartment = string;

export type WorkflowStatus = "draft" | "active" | "paused" | "archived";

export type ExecutionStatus =
  | "pending"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type TriggerType = "manual" | "schedule" | "event" | "webhook" | (string & {});

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "greater_than"
  | "less_than"
  | (string & {});

export type ActionType =
  | "notify"
  | "assign_agent"
  | "update_record"
  | "invoke_workflow"
  | "log"
  | (string & {});

export type QueueItemStatus = "waiting" | "processing" | "done" | "failed";

export interface WorkflowContextData {
  [key: string]: string | number | boolean | null | undefined;
}

export interface WorkflowMetadata {
  workspaceId?: string;
  ownerId?: string;
  tags?: string[];
  [key: string]: string | number | boolean | string[] | null | undefined;
}

export interface WorkflowFilter {
  department?: WorkflowDepartment;
  status?: WorkflowStatus;
  tag?: string;
}

export interface ExecutionFilter {
  workflowId?: string;
  department?: WorkflowDepartment;
  status?: ExecutionStatus;
}

export const WORKFLOW_DEPARTMENTS = {
  YOUTUBE: "youtube",
  CALMA: "calma",
  MARKETING: "marketing",
  FINANCEIRO: "financeiro",
  CRM: "crm",
} as const;

export const WORKFLOW_DEPARTMENT_LABELS: Record<string, string> = {
  youtube: "YouTube",
  calma: "Calma",
  marketing: "Marketing",
  financeiro: "Financeiro",
  crm: "CRM",
};
