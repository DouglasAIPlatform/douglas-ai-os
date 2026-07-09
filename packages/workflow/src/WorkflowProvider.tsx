"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { Queue } from "./Queue";
import { WorkflowContext } from "./WorkflowContext";
import { WorkflowEngine } from "./WorkflowEngine";
import { WorkflowRegistry } from "./WorkflowRegistry";
import type { Workflow } from "./Workflow";
import type { ExecutionFilter, WorkflowFilter } from "./WorkflowTypes";
import type { TriggerWorkflowInput } from "./WorkflowEngine";

export interface WorkflowProviderProps {
  children: ReactNode;
  workflows: Workflow[];
}

export function WorkflowProvider({ children, workflows }: WorkflowProviderProps) {
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const { engine, registry, queue } = useMemo(() => {
    const nextRegistry = new WorkflowRegistry();
    const nextQueue = new Queue();
    const nextEngine = new WorkflowEngine(nextRegistry, nextQueue);
    nextEngine.bootstrap(workflows);
    return { engine: nextEngine, registry: nextRegistry, queue: nextQueue };
  }, [workflows]);

  const refresh = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  const workflowList = useMemo(
    () => engine.listWorkflows(),
    [engine, version],
  );

  const executions = useMemo(
    () => engine.listExecutions(),
    [engine, version],
  );

  const queueItems = useMemo(() => queue.list(), [queue, version]);

  const activeWorkflow =
    workflowList.find((workflow) => workflow.id === activeWorkflowId) ?? null;

  const activeExecution =
    executions.find((execution) => execution.id === activeExecutionId) ?? null;

  const listWorkflows = useCallback(
    (filter?: WorkflowFilter) => engine.listWorkflows(filter),
    [engine],
  );

  const listExecutions = useCallback(
    (filter?: ExecutionFilter) => engine.listExecutions(filter),
    [engine],
  );

  const triggerWorkflow = useCallback(
    (input: TriggerWorkflowInput) => {
      const execution = engine.trigger(input);
      refresh();
      return execution;
    },
    [engine, refresh],
  );

  const processNext = useCallback(() => {
    const execution = engine.processNext();
    refresh();
    return execution;
  }, [engine, refresh]);

  const getWorkflowById = useCallback(
    (workflowId: string) => registry.get(workflowId),
    [registry],
  );

  const value = useMemo(
    () => ({
      engine,
      registry,
      workflows: workflowList,
      executions,
      queueItems,
      activeWorkflowId,
      activeWorkflow,
      activeExecutionId,
      activeExecution,
      selectWorkflow: setActiveWorkflowId,
      clearWorkflowSelection: () => setActiveWorkflowId(null),
      selectExecution: setActiveExecutionId,
      clearExecutionSelection: () => setActiveExecutionId(null),
      listWorkflows,
      listExecutions,
      triggerWorkflow,
      processNext,
      getWorkflowById,
    }),
    [
      activeExecution,
      activeExecutionId,
      activeWorkflow,
      activeWorkflowId,
      engine,
      executions,
      getWorkflowById,
      listExecutions,
      listWorkflows,
      processNext,
      queueItems,
      registry,
      triggerWorkflow,
      workflowList,
    ],
  );

  return (
    <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>
  );
}
