"use client";

import { createContext } from "react";
import type { BrainTask } from "../types";

export interface TaskContextValue {
  tasks: BrainTask[];
  activeTaskId: string | null;
  activeTask: BrainTask | null;
  selectTask: (taskId: string) => void;
  clearTaskSelection: () => void;
  getTaskById: (taskId: string) => BrainTask | undefined;
  getTasksByWorkspace: (workspaceId: string) => BrainTask[];
}

export const TaskContext = createContext<TaskContextValue | null>(null);
