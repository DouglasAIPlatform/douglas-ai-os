import { evaluateAllConditions } from "./Condition";
import { simulateAction } from "./Action";
import {
  createExecution,
  updateExecutionStatus,
  type Execution,
  type TaskExecution,
} from "./Execution";
import { getOrderedTaskIds } from "./Pipeline";
import { Queue } from "./Queue";
import { areTaskDependenciesMet } from "./Task";
import { getWorkflowTask, isWorkflowRunnable } from "./Workflow";
import { WorkflowRegistry } from "./WorkflowRegistry";
import type {
  ExecutionFilter,
  WorkflowContextData,
  WorkflowFilter,
} from "./WorkflowTypes";

export interface TriggerWorkflowInput {
  workflowId: string;
  triggerId?: string;
  context?: WorkflowContextData;
  priority?: number;
}

export class WorkflowEngine {
  private readonly registry: WorkflowRegistry;
  private readonly queue: Queue;
  private executions = new Map<string, Execution>();

  constructor(registry: WorkflowRegistry, queue: Queue) {
    this.registry = registry;
    this.queue = queue;
  }

  getRegistry(): WorkflowRegistry {
    return this.registry;
  }

  getQueue(): Queue {
    return this.queue;
  }

  bootstrap(workflows: Parameters<WorkflowRegistry["registerMany"]>[0]): void {
    this.registry.registerMany(workflows);
  }

  trigger(input: TriggerWorkflowInput): Execution | null {
    const workflow = this.registry.get(input.workflowId);
    if (!workflow || !isWorkflowRunnable(workflow)) return null;

    const taskIds = getOrderedTaskIds(workflow.pipeline);
    const execution = createExecution({
      id: `exec:${Date.now()}:${this.executions.size}`,
      workflowId: workflow.id,
      department: workflow.department,
      triggerId: input.triggerId,
      context: input.context,
      taskIds,
    });

    this.executions.set(execution.id, execution);
    this.queue.enqueue({
      executionId: execution.id,
      workflowId: workflow.id,
      department: workflow.department,
      priority: input.priority,
    });

    const queued = updateExecutionStatus(execution, "queued");
    this.executions.set(execution.id, queued);
    return queued;
  }

  processNext(): Execution | null {
    const item = this.queue.dequeue();
    if (!item) return null;

    const execution = this.executions.get(item.executionId);
    if (!execution) {
      this.queue.complete(item.id, true);
      return null;
    }

    const workflow = this.registry.get(execution.workflowId);
    if (!workflow) {
      this.queue.complete(item.id, true);
      return null;
    }

    let current = updateExecutionStatus(execution, "running");
    const completedTaskIds = new Set<string>();

    const taskExecutions: TaskExecution[] = workflow.tasks
      .sort((a, b) => a.order - b.order)
      .map((task) => {
        if (!areTaskDependenciesMet(task, completedTaskIds)) {
          return {
            taskId: task.id,
            status: "cancelled" as const,
            actionResults: [],
          };
        }

        const startedAt = new Date().toISOString();
        const actionResults = task.actions
          .filter((action) =>
            evaluateAllConditions(action.conditions, current.context),
          )
          .map((action) => simulateAction(action));

        completedTaskIds.add(task.id);

        return {
          taskId: task.id,
          status: "completed" as const,
          startedAt,
          completedAt: new Date().toISOString(),
          actionResults,
        };
      });

    current = {
      ...current,
      taskExecutions,
      status: "completed",
      completedAt: new Date().toISOString(),
    };

    this.executions.set(current.id, current);
    this.queue.complete(item.id, false);
    return current;
  }

  getExecution(executionId: string): Execution | undefined {
    return this.executions.get(executionId);
  }

  listExecutions(filter: ExecutionFilter = {}): Execution[] {
    return Array.from(this.executions.values()).filter((execution) => {
      if (filter.workflowId && execution.workflowId !== filter.workflowId) {
        return false;
      }

      if (filter.department && execution.department !== filter.department) {
        return false;
      }

      if (filter.status && execution.status !== filter.status) {
        return false;
      }

      return true;
    });
  }

  listWorkflows(filter?: WorkflowFilter) {
    return filter ? this.registry.filter(filter) : this.registry.getAll();
  }

  getWorkflowTask(workflowId: string, taskId: string) {
    const workflow = this.registry.get(workflowId);
    if (!workflow) return undefined;
    return getWorkflowTask(workflow, taskId);
  }
}
