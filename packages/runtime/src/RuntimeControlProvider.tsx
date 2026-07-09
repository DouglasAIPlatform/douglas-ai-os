"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { RuntimeControlContext } from "./RuntimeControlContext";
import { createRuntimeControlService } from "./RuntimeControlService";
import type { RuntimeActionEventPayload, RuntimeActionType } from "./RuntimeControlTypes";
import { usePlatformRuntime } from "./usePlatformRuntime";

export interface RuntimeControlProviderProps {
  children: ReactNode;
  publishActionEvent?: (topic: string, payload: RuntimeActionEventPayload) => void;
}

export function RuntimeControlProvider({
  children,
  publishActionEvent,
}: RuntimeControlProviderProps) {
  const { manager } = usePlatformRuntime();
  const [version, setVersion] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  const service = useMemo(
    () =>
      createRuntimeControlService({
        manager,
        publish: publishActionEvent,
      }),
    [manager, publishActionEvent],
  );

  const modules = useMemo(() => manager.getState().modules, [manager, version]);

  const executeAction = useCallback(
    async (moduleId: string, action: RuntimeActionType) => {
      setIsExecuting(true);
      try {
        const result = await service.execute(moduleId, action);
        setVersion((current) => current + 1);
        return result;
      } finally {
        setIsExecuting(false);
      }
    },
    [service],
  );

  const value = useMemo(
    () => ({
      service,
      panel: service.getPanel(),
      modules,
      lastCommand: service.getPanel().getLastCommand(),
      lastResult: service.getPanel().getLastResult(),
      executeAction,
      isExecuting,
    }),
    [executeAction, isExecuting, modules, service, version],
  );

  return (
    <RuntimeControlContext.Provider value={value}>{children}</RuntimeControlContext.Provider>
  );
}
