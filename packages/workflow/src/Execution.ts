import type { ActionResult } from "./Action";
import type {
  ExecutionStatus,
  WorkflowContextData,
  WorkflowDepartment,
} from "./WorkflowTypes";

export interface TaskExecution {
  taskId: string;
  status: ExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  actionResults: ActionResult[];
}

export interface Execution {
  id: string;
  workflowId: string;
  department: WorkflowDepartment;
  status: ExecutionStatus;
  triggerId?: string;
  context: WorkflowContextData;
  taskExecutions: TaskExecution[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export function createExecution(input: {
  id: string;
  workflowId: string;
  department: WorkflowDepartment;
  triggerId?: string;
  context?: WorkflowContextData;
  taskIds: string[];
}): Execution {
  const now = new Date().toISOString();

  return {
    id: input.id,
    workflowId: input.workflowId,
    department: input.department,
    status: "pending",
    triggerId: input.triggerId,
    context: input.context ?? {},
    taskExecutions: input.taskIds.map((taskId) => ({
      taskId,
      status: "pending",
      actionResults: [],
    })),
    createdAt: now,
  };
}

export function updateExecutionStatus(
  execution: Execution,
  status: ExecutionStatus,
): Execution {
  const now = new Date().toISOString();

  return {
    ...execution,
    status,
    startedAt: status === "running" ? execution.startedAt ?? now : execution.startedAt,
    completedAt:
      status === "completed" || status === "failed" || status === "cancelled"
        ? now
        : execution.completedAt,
  };
}
