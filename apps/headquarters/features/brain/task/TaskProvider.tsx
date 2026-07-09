"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { mockTasks } from "../mocks";
import { useBrainMockState } from "../useBrainMockState";
import { TaskContext } from "./TaskContext";

interface TaskProviderProps {
  children: ReactNode;
}

export function TaskProvider({ children }: TaskProviderProps) {
  const tasks = useBrainMockState(mockTasks);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? null;

  function getTaskById(taskId: string) {
    return tasks.find((task) => task.id === taskId);
  }

  function getTasksByWorkspace(workspaceId: string) {
    return tasks.filter((task) => task.workspaceId === workspaceId);
  }

  const value = useMemo(
    () => ({
      tasks,
      activeTaskId,
      activeTask,
      selectTask: setActiveTaskId,
      clearTaskSelection: () => setActiveTaskId(null),
      getTaskById,
      getTasksByWorkspace,
    }),
    [activeTask, activeTaskId, tasks],
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}
