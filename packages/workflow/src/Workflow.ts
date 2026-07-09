import type { Pipeline } from "./Pipeline";
import type { WorkflowTask } from "./Task";
import type { Trigger } from "./Trigger";
import type {
  WorkflowDepartment,
  WorkflowMetadata,
  WorkflowStatus,
} from "./WorkflowTypes";

export interface Workflow {
  id: string;
  name: string;
  description: string;
  department: WorkflowDepartment;
  status: WorkflowStatus;
  pipeline: Pipeline;
  tasks: WorkflowTask[];
  triggers: Trigger[];
  version: number;
  metadata: WorkflowMetadata;
  createdAt: string;
  updatedAt: string;
}

export function createWorkflow(
  input: Omit<Workflow, "version" | "createdAt" | "updatedAt" | "metadata"> & {
    version?: number;
    metadata?: WorkflowMetadata;
    createdAt?: string;
    updatedAt?: string;
  },
): Workflow {
  const now = new Date().toISOString();

  return {
    ...input,
    version: input.version ?? 1,
    metadata: input.metadata ?? {},
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

export function getWorkflowTask(
  workflow: Workflow,
  taskId: string,
): WorkflowTask | undefined {
  return workflow.tasks.find((task) => task.id === taskId);
}

export function isWorkflowRunnable(workflow: Workflow): boolean {
  return workflow.status === "active";
}
