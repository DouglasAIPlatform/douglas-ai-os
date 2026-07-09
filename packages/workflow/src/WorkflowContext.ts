"use client";

import { createContext } from "react";
import type { Execution } from "./Execution";
import type { QueueItem } from "./Queue";
import type { WorkflowEngine, TriggerWorkflowInput } from "./WorkflowEngine";
import type { Workflow } from "./Workflow";
import type { WorkflowRegistry } from "./WorkflowRegistry";
import type {
  ExecutionFilter,
  WorkflowFilter,
} from "./WorkflowTypes";

export interface WorkflowContextValue {
  engine: WorkflowEngine;
  registry: WorkflowRegistry;
  workflows: Workflow[];
  executions: Execution[];
  queueItems: QueueItem[];
  activeWorkflowId: string | null;
  activeWorkflow: Workflow | null;
  activeExecutionId: string | null;
  activeExecution: Execution | null;
  selectWorkflow: (workflowId: string) => void;
  clearWorkflowSelection: () => void;
  selectExecution: (executionId: string) => void;
  clearExecutionSelection: () => void;
  listWorkflows: (filter?: WorkflowFilter) => Workflow[];
  listExecutions: (filter?: ExecutionFilter) => Execution[];
  triggerWorkflow: (input: TriggerWorkflowInput) => Execution | null;
  processNext: () => Execution | null;
  getWorkflowById: (workflowId: string) => Workflow | undefined;
}

export const WorkflowContext = createContext<WorkflowContextValue | null>(null);
