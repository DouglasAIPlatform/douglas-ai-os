import type { Action } from "./Action";

export interface WorkflowTask {
  id: string;
  name: string;
  description: string;
  actions: Action[];
  dependsOn: string[];
  order: number;
}

export function createWorkflowTask(
  input: Omit<WorkflowTask, "dependsOn" | "order"> & {
    dependsOn?: string[];
    order?: number;
  },
): WorkflowTask {
  return {
    ...input,
    dependsOn: input.dependsOn ?? [],
    order: input.order ?? 0,
  };
}

export function areTaskDependenciesMet(
  task: WorkflowTask,
  completedTaskIds: Set<string>,
): boolean {
  return task.dependsOn.every((taskId) => completedTaskIds.has(taskId));
}
